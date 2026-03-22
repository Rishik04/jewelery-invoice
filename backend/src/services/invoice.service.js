import CompanyModel from "../model/companyModel.js";
import InvoiceModel from "../model/invoice.model.js";
import Product from "../model/product.model.js";
import { logger } from "../utils/logger.js";

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
  const invoiceNumber = await createInvoiceNumber();

  // Map submitted items to invoice items with product snapshots
  const invoiceItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.id);
    if (!product) throw new Error("Product not found: " + item.id);

    const weight = item.weight || 0;
    const quantity = item.quantity || 1;
    const rate = Number(item.rate/10) || 0;
    const total = weight * quantity * rate; // rate per gram,

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
      makingCharges: item.makingCharges || 0,
      otherCharges: item.otherCharges || 0,
    };
  });

  // Compute subtotal, tax and totalAmount
  const subtotal = invoiceItems.reduce((sum, it) => {
    const lineTotal = it.total + (it.total * it.makingCharges) / 100 + (it.otherCharges || 0);
    return sum + lineTotal;
  }, 0);

  const taxRate = 3; // 1.5% SGST + 1.5% CGST
  const tax = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const totalAmount = parseFloat((subtotal + tax).toFixed(2));

  const updatedData = {
    ...data,
    companyId: company._id,
    userId,
    invoiceNumber,
    items: invoiceItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax,
    totalAmount,
    _company: company,
  };

  const invoice = await new InvoiceModel({   // FIX: added `new`
    companyId: updatedData.companyId,
    userId: updatedData.userId,
    invoiceNumber: updatedData.invoiceNumber,
    items: updatedData.items,
    customer: updatedData.customer,
    subtotal: updatedData.subtotal,
    tax: updatedData.tax,
    totalAmount: updatedData.totalAmount,
    status: "FINAL"
  }).save();

  // Attach populated company on the returned object (not persisted) for PDF generation
  const invoiceObj = invoice.toObject();
  invoiceObj._company = company.toObject();
  return invoiceObj;
};

const createInvoiceNumber = async () => {
  const invoiceCount = await InvoiceModel.countDocuments();
  const index = invoiceCount + 1;
  return `SJ_${String(index).padStart(5, "0")}`;
};

// Update invoice with the generated PDF file path
export const updateInvoiceFilePath = async (invoiceNumber, filePath) => {
  return await InvoiceModel.findOneAndUpdate(
    { invoiceNumber },
    { filePath },
    { new: true }
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
    { new: true }
  );
};
