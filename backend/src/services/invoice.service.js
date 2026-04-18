import CompanyModel from "../model/companyModel.js";
import InvoiceModel from "../model/invoice.model.js";
import Product from "../model/product.model.js";
import Sequence from "../model/sequence.js";
import { logger } from "../utils/logger.js";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { createCustomerData } from "./company.service.js";

const resolveMonthYear = (fy, month) => {
  const [startYear, endYear] = fy.split("-").map(Number);
  return month >= 4 ? startYear : endYear;
};

const getMonthRange = (year, month) => ({
  start: new Date(Date.UTC(year, month - 1, 1)),
  end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
});

const getFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Jan = 0

  if (month >= 4) {
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    return `${year - 1}-${String(year).slice(2)}`;
  }
};

//save invoice in db and return the populated invoice document
export const saveInvoiceInDB = async (userId, data) => {
  const company = await CompanyModel.findOne({ userId: userId })
    .populate("address")
    .populate("bank");

  if (!company) throw new Error("Company not found for tenantId: " + userId);

  const products = await Product.find({ userId: userId });

  logger.info("Company data: " + company._id);
  logger.info("Products count: " + products.length);

  const { items, customer } = data;
  await createCustomerData(customer, company._id, userId);

  // Map submitted items to invoice items with product snapshots
  const invoiceItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.id);
    if (!product) throw new Error("Product not found: " + item.id);

    const weight = item.weight || 0;
    const quantity = item.quantity || 1;
    const rate = Number(item.rate / 10) || 0;
    const total = Number(weight * quantity * rate);

    const makingCharges =
      item.makingChargesType === "PERCENT"
        ? Number(((total * item.makingCharges) / 100).toFixed(2))
        : Number(item.makingCharges);

    logger.info("Total calculation of the item " + product.name + total);

    return {
      productId: product._id,
      name: product.name,
      category: product.category,
      karat: product.karat,
      hsnNumber: product.hsnNumber,
      weight,
      quantity,
      rate,
      total,
      makingCharges,
      otherCharges: item.otherCharges || 0,
    };
  });

  // Compute subtotal, tax and totalAmount
  const subtotal = invoiceItems.reduce((sum, it) => {
    const lineTotal = it.total + it.makingCharges;
    return sum + lineTotal;
  }, 0);

  const otherChargesTotal = invoiceItems.reduce((sum, it) => {
    const total = it.otherCharges;
    return sum + total;
  }, 0);

  logger.info("Total other charges " + otherChargesTotal);

  const taxRate = 3; // 1.5% SGST + 1.5% CGST
  const tax = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const totalAmount = parseFloat(otherChargesTotal + subtotal + tax).toFixed(2);
  const invoiceNumber = await createInvoiceNumber(company._id);

  const updatedData = {
    ...data,
    companyId: company._id,
    userId,
    invoiceNumber,
    items: invoiceItems,
    subtotal: parseFloat(subtotal).toFixed(2),
    tax,
    totalAmount,
    _company: company,
  };

  const invoice = await new InvoiceModel({
    // FIX: added `new`
    companyId: updatedData.companyId,
    userId: updatedData.userId,
    invoiceNumber: updatedData.invoiceNumber,
    items: updatedData.items,
    customer: updatedData.customer,
    subtotal: updatedData.subtotal,
    tax: updatedData.tax,
    totalAmount: updatedData.totalAmount,
    status: "FINAL",
  }).save();

  // Attach populated company on the returned object (not persisted) for PDF generation
  const invoiceObj = invoice.toObject();
  invoiceObj._company = company.toObject();
  return invoiceObj;
};

export const createInvoiceNumber = async (companyId) => {
  const fy = getFinancialYear();

  const counter = await Sequence.findOneAndUpdate(
    { fy, companyId: companyId || null },
    { $inc: { seq: 1 } },
    {
      new: true,
      upsert: true,
    },
  );
  const seq = counter.seq;
  return `SJ_${fy}_${String(seq).padStart(4, "0")}`;
};

export const updateInvoiceFilePath = async (invoiceNumber, filePath, companyId) => {
  return await InvoiceModel.findOneAndUpdate(
    { companyId, invoiceNumber },
    { filePath },
    { new: true },
  );
};

export const cancelInvoiceService = async (id) => {
  return await InvoiceModel.findOneAndUpdate(
    { _id: id, status: { $ne: "CANCELLED" } },
    {
      $set: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    },
    { new: true },
  );
};

export const getInvoicesWithPageNumber = async (page, limit, userId) => {
  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    InvoiceModel.find({ userId: userId })
      .sort({ invoiceNumber: -1 }) // 🔥 latest first
      .skip(skip)
      .limit(limit)
      .lean(),

    InvoiceModel.countDocuments({ userId: userId }),
  ]);

  return {
    data: invoices,
    total,
    page,
    limit,
  };
};

export const getInvoicesForDownload = async (fy, month, userId) => {
  const year = resolveMonthYear(fy, month);
  const { start, end } = getMonthRange(year, month);

  console.log(year, start, end, userId);

  return await InvoiceModel.find({
    userId,
    createdAt: { $gte: start, $lte: end },
    status: { $ne: "CANCELLED" },
  })
    .sort({ createdAt: 1 })
    .lean();
};

export const downloadInvoicesService = async ({ fy, month, userId, res }) => {
  const invoices = await getInvoicesForDownload(fy, month, userId);
  if (invoices.length === 0) {
    return res.status(404).json({
      message: "No invoices found for selected period",
    });
  }
  const monthName = new Date(0, month - 1).toLocaleString("en", {
    month: "short",
  });
  const zipName = `invoices-${fy}-${monthName}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => {
    console.error("Archive error:", err);
    if (!res.headersSent)
      res.status(500).json({ message: "Failed to create zip" });
  });
  archive.pipe(res);

  for (const inv of invoices) {
    if (!inv.filePath) {
      console.warn(`No filePath: ${inv.invoiceNumber}`);
      continue;
    }

    // ── This is the critical line ──
    const fullPath = path.join(process.cwd(), "src", "public", inv.filePath);
    console.log(
      `Invoice ${inv.invoiceNumber} → ${fullPath} | exists: ${fs.existsSync(fullPath)}`,
    );

    if (fs.existsSync(fullPath)) {
      archive.file(fullPath, { name: `invoice-${inv.invoiceNumber}.pdf` });
    } else {
      console.warn(`Missing PDF: ${fullPath}`);
    }
  }

  await archive.finalize();
};

export const getInvoicesByIdService = async (id, userId) => {
  logger.info("Fetching invoice by id " + id);
  const invoice = await InvoiceModel.findOne({
    _id: id,
    userId: userId,
  }).select("filePath");
  if (!invoice) {
    throw new Error("Invoice not found or unauthorized");
  }
  return invoice;
};
