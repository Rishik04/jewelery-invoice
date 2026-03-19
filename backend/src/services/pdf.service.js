import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import CompanyCacheModel from "../model/company.cache.model.js";
import CompanyModel from "../model/companyModel.js";
import { convertAmountToIndianWords } from "../utils/converision.js";

const IMAGE_PATH = path.join(process.cwd(), "src", "public", "images");

const DEFAULT_FONTS = {
  Normal: path.join(process.cwd(), "src", "public", "fonts", "arial.ttf"),
  Bold: path.join(process.cwd(), "src", "public", "fonts", "ARIALBD.ttf"),
};

// ─── Header ─────────────────────────────────────────────────────────────────

const generateHeader = (doc, company) => {
  const IMAGE_WIDTH = 150;
  const PAGE_WIDTH = doc.page.width;
  const MARGIN = 10;
  const IMAGE_HEIGHT = doc.y;

  doc
    .fontSize(10)
    .font("bold")
    .text(`GSTIN: `, { align: "left", continued: true })
    .font("normal")
    .text(`${company.gstin}`)
    .font("bold")
    .text(`CUSTOMER COPY`, doc.x, IMAGE_HEIGHT, { align: "right", underline: true })
    .font("normal")
    .text(`${Array.isArray(company.phone) ? company.phone[0] : company.phone}`, doc.x, doc.y + 2, { align: "right" })
    .font("bold")
    .text(`HM.No.: `, doc.x, doc.y - 10, { align: "left", continued: true })
    .font("normal")
    .text(`${company.hallMarkNumber || ""}`)
    .moveDown();

  // Brand & hallmark logos (skip gracefully if missing)
  const brandPath = path.join(IMAGE_PATH, "brand.png");
  const hallmarkPath = path.join(IMAGE_PATH, "hallmark.png");
  if (fs.existsSync(brandPath)) {
    doc.image(brandPath, MARGIN, IMAGE_HEIGHT, { width: 130, align: "left" });
  }
  if (fs.existsSync(hallmarkPath)) {
    doc.image(hallmarkPath, PAGE_WIDTH - IMAGE_WIDTH - MARGIN, IMAGE_HEIGHT, { width: 130, align: "right" });
  }

  const addressStreet = company.address?.street ?? (typeof company.address === "string" ? company.address : "");

  doc
    .fontSize(25)
    .font("bold")
    .text(company.name.toUpperCase(), { align: "center", underline: true })
    .font("normal")
    .fontSize(12)
    .text(addressStreet, { align: "center" })
    .fontSize(10)
    .text(`Email: ${company.email}`, { align: "center" })
    .moveDown(2);
};

// ─── Customer Info ───────────────────────────────────────────────────────────

const generateCustomerInfo = (doc, invoice, company) => {
  const COLUMN_HEIGHT = doc.y - 2;

  doc
    .font("bold")
    .fontSize(10)
    .text("Customer Name & Address:", 12, doc.y - 5, { underline: true })
    .moveDown()
    .text(invoice.customer.name, 12, doc.y)
    .font("normal")
    .text(invoice.customer.address || "", 12, doc.y)
    .text(`Ph # ${invoice.customer.phone || ""}`, 12, doc.y)
    .moveDown(2)
    .text(`State: ${company.address?.state || ""}`)
    .text(`Code: ${company.address?.statecode || ""}`)
    .moveDown();

  doc
    .moveTo(320, COLUMN_HEIGHT - 10)
    .lineTo(320, doc.y - 2)
    .stroke();

  const infoY = COLUMN_HEIGHT;
  let date = invoice.createdAt;

  // FIX: use actual invoiceNumber instead of hardcoded "123"
  doc
    .font("bold")
    .text("Bill No: ", 325, infoY, { continued: true })
    .font("normal")
    .text(invoice.invoiceNumber);

  const displayDate = date ? new Date(date).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
  doc
    .font("bold")
    .text("Date: ", 450, doc.y - 10, { continued: true })
    .font("normal")
    .text(displayDate);

  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  doc
    .font("bold")
    .text("YEAR: ", 325, doc.y + 5, { continued: true })
    .font("normal")
    .text(`${year}-${year + 1}`);

  doc
    .moveTo(320, doc.y + 5)
    .lineTo(doc.page.width - 7, doc.y + 5)
    .stroke();

  doc.font("bold").text("Consignee Details :", 325, doc.y + 6);

  doc
    .moveTo(320, doc.y + 2)
    .lineTo(doc.page.width - 7, doc.y + 2)
    .stroke();

  doc
    .font("bold")
    .text(`${invoice.customer.name}`, 325, doc.y + 5)
    .font("normal")
    .text(`${invoice.customer.address || ""}`, 325, doc.y + 10)
    .text(`Ph # ${invoice.customer.phone || ""}`, 325, doc.y + 10);

  doc.y = COLUMN_HEIGHT + 110;
};

// ─── Items Table ─────────────────────────────────────────────────────────────

const formatMoney = (value) => {
  const num = Number(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const categories = {"GOLD": "G", "SILVER": "S", "DIAMOND": "D"};

const calculateGST = (value, gstPercentage) => (value * gstPercentage) / 100;

const calculateTotal = (rows, columnIndex) =>
  rows.reduce((sum, row) => sum + parseFloat(row[columnIndex] || 0), 0).toFixed(2);

const generateItemsTable = (doc, invoice) => {
  const tableConfig = {
    headers: [
      { text: "Type",           width: 30,  align: "center" },
      { text: "Description",    width: 100, align: "center" },
      { text: "HSN Code",       width: 40,  align: "center" },
      { text: "Purity",         width: 40,  align: "center" },
      { text: "Gross Wt",       width: 40,  align: "center" },
      { text: "Rate",           width: 60,  align: "center" },
      { text: "Value",          width: 60,  align: "center" },
      { text: "Making Charges", width: 60,  align: "center" },
      { text: "Other",          width: 50,  align: "center" },
      { text: "Amount",         width: 80,  align: "center" },
    ],
    columnSpacing: 2,
    rowHeight: 20,
    headerHeight: 30,
    margin: { left: 10, top: doc.y, right: 10 },
  };

  tableConfig.rows = (invoice.items || []).map((item) => {
    const totalRate = item.total
    const makingCharges = (totalRate * item.makingCharges) / 100;
    const totalCharges =  parseFloat(totalRate + makingCharges + (item.otherCharges || 0)).toFixed(2);

    return [
      categories[item.category] || "",
      item.name || "",
      item.hsnNumber || "",
      item.karat || "",
      Number(item.weight).toFixed(3),
      formatMoney(item.rate),
      formatMoney(totalRate),
      formatMoney(makingCharges),
      item.otherCharges ? formatMoney(item.otherCharges) : "0.00",
      formatMoney(totalCharges),
    ];
  });

  const totalAmount = parseFloat(calculateTotal(tableConfig.rows, 9));
  const totalWithGST = totalAmount + calculateGST(totalAmount, 1.5) * 2;

  drawTableWithGrid(doc, tableConfig);
  drawTotalsSection(doc, tableConfig, totalAmount, totalWithGST);

  return totalWithGST;
};

const drawTableWithGrid = (doc, config) => {
  const { headers, rows, margin, rowHeight, headerHeight, columnSpacing } = config;

  config.totalWidth =
    headers.reduce((sum, header) => sum + header.width + columnSpacing, 0) - columnSpacing;

  // Customer info box outline
  doc
    .moveTo(margin.left, margin.top - 120)
    .lineTo(margin.left + config.totalWidth, margin.top - 120)
    .lineTo(margin.left + config.totalWidth, margin.top)
    .lineTo(margin.left, margin.top)
    .lineTo(margin.left, margin.top - 120)
    .stroke();

  doc.rect(margin.left, margin.top, config.totalWidth, headerHeight).stroke();

  let x = margin.left;
  doc.font("bold");

  headers.forEach((header) => {
    doc
      .moveTo(x, margin.top)
      .lineTo(x, margin.top + headerHeight + rows.length * rowHeight)
      .stroke();

    doc.text(header.text, x + 2, margin.top + 5, {
      width: header.width - 4,
      align: header.align,
    });

    x += header.width + columnSpacing;
  });

  doc
    .moveTo(x - columnSpacing, margin.top)
    .lineTo(x - columnSpacing, margin.top + headerHeight + rows.length * rowHeight)
    .stroke();

  doc.font("normal");

  let y = margin.top + headerHeight;
  rows.forEach((row) => {
    doc
      .moveTo(margin.left, y)
      .lineTo(margin.left + config.totalWidth, y)
      .stroke();

    x = margin.left;
    row.forEach((cell, colIndex) => {
      doc.text(String(cell), x + 2, y + 5, {
        width: headers[colIndex].width - 4,
        align: headers[colIndex].align,
      });
      x += headers[colIndex].width + columnSpacing;
    });

    y += rowHeight;
    doc.y = y;
  });

  doc
    .moveTo(margin.left, y)
    .lineTo(margin.left + config.totalWidth, y)
    .stroke();
};

const drawTotalsSection = (doc, config, totalAmount, totalWithGST) => {
  const { margin, totalWidth, rowHeight } = config;
  let y = margin.top + config.headerHeight + config.rows.length * rowHeight + rowHeight;

  doc.moveTo(margin.left, margin.top).lineTo(margin.left, y + 65).stroke();
  doc.moveTo(margin.left + totalWidth, margin.top).lineTo(margin.left + totalWidth, y + 65).stroke();

  doc.font("bold");

  y -= 10;
  doc.text("Total", margin.left + 2, y, { align: "left" });
  doc.text(calculateTotal(config.rows, 4), margin.left + 240, y, { align: "left" });
  doc.text(calculateTotal(config.rows, 7), margin.left + 395, y, { align: "left" });
  doc.text(formatMoney(totalAmount), margin.left + totalWidth - 62, y, { align: "right" });

  doc.moveTo(margin.left, y + 15).lineTo(margin.left + totalWidth, y + 15).stroke();

  y += rowHeight;
  const gstAmount = calculateGST(totalAmount, 1.5);

  doc.text("SGST: 1.50%", margin.left, y, { width: totalWidth - 90, align: "right" });
  doc.text(formatMoney(gstAmount), margin.left + totalWidth - 62, y, { align: "right" });

  y += rowHeight;
  doc.text("CGST: 1.50%", margin.left, y, { width: totalWidth - 90, align: "right" });

  doc
    .moveTo(margin.left + totalWidth - 80, margin.top)
    .lineTo(margin.left + totalWidth - 80, y + 35)
    .stroke();

  doc.text(formatMoney(gstAmount), margin.left + totalWidth - 62, y, { align: "right" });

  doc.moveTo(margin.left, y + 15).lineTo(margin.left + totalWidth, y + 15).stroke();

  y += rowHeight;
  doc.text("Total Amt. With Tax.", margin.left, y, { width: totalWidth - 90, align: "right" });
  doc.text(formatMoney(totalWithGST), margin.left + totalWidth - 62, y, { align: "right" });

  doc.fontSize(8).text(convertAmountToIndianWords(totalWithGST), margin.left + 2, y);

  doc.moveTo(margin.left, y + 15).lineTo(margin.left + totalWidth, y + 15).stroke();
};

// ─── Footer ──────────────────────────────────────────────────────────────────

const generateFooter = (doc, company) => {
  doc.x = 10;
  doc.moveDown(2).fontSize(8).text("Terms & Conditions:", { underline: true });

  const terms = company.termsConditions || [];
  terms.forEach((term, index) => {
    doc.text(`${index + 1}. ${term}`);
  });

  doc
    .moveDown(2)
    .text(`FOR ${company.name.toUpperCase()}`, { align: "right" })
    .moveDown(1)
    .text("Authorized Signatory", { align: "right" });

  const logoPath = path.join(IMAGE_PATH, "logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 490, doc.y - 70, { width: 100, align: "center" });
  }

  if (company.bank) {
    const HEIGHT = doc.y + 15;
    const LEFT = doc.x;

    doc
      .moveTo(LEFT, HEIGHT)
      .lineTo(LEFT + 200, HEIGHT)
      .lineTo(LEFT + 200, HEIGHT + 70)
      .lineTo(LEFT, HEIGHT + 70)
      .lineTo(LEFT, HEIGHT)
      .stroke();

    doc
      .moveTo(15, HEIGHT)
      .moveDown(2)
      .fontSize(8)
      .text("Bank Details:", LEFT + 70, HEIGHT + 10, { underline: true })
      .text(`Bank Name: ${company.bank.bankName}`, LEFT + 10, HEIGHT + 22)
      .text(`Branch: ${company.bank.branch}`)
      .text(`A/c No: ${company.bank.accountNumber}`)
      .text(`IFSC Code: ${company.bank.ifsc}`);
  }

  doc
    .moveDown(2)
    .fontSize(10)
    .text('"MOST TRUSTED JEWELLERS"', { align: "center" })
    .text("THANK YOU, VISIT AGAIN", { align: "center" });
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const createPDF = async (invoice) => {
  // FIX: try CompanyCache first (populated in microservice setup), fall back to CompanyModel
  let company = null;

  if (invoice._company) {
    // Already attached by invoice.service (most efficient path)
    company = invoice._company;
  } else {
    company = await CompanyModel.findOne({ _id: invoice.companyId }).lean();
    if (!company) {
      company = await CompanyModel.findById(invoice.companyId)
        .populate("address")
        .populate("bank")
        .lean();
    }
  }

  if (!company) {
    throw new Error("Company not found for companyId: " + invoice.companyId);
  }

  const doc = new PDFDocument({ size: "A4", margin: 10, layout: "portrait" });

  // Register custom fonts if they exist, otherwise skip (pdfkit uses built-in Helvetica)
  if (fs.existsSync(DEFAULT_FONTS.Normal)) {
    doc.registerFont("normal", DEFAULT_FONTS.Normal);
    doc.registerFont("bold", DEFAULT_FONTS.Bold);
  } else {
    doc.registerFont("normal", "Helvetica");
    doc.registerFont("bold", "Helvetica-Bold");
  }

  const fileName = `${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(process.cwd(), "src", "public", "invoices", fileName);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  generateHeader(doc, company);
  generateCustomerInfo(doc, invoice, company);
  generateItemsTable(doc, invoice);
  generateFooter(doc, company);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve({ filePath, fileName }));
    stream.on("error", reject);
  });
};
