import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import CompanyModel from "../model/companyModel.js";
import { convertAmountToIndianWords } from "../utils/converision.js";

const IMAGE_PATH = path.join(process.cwd(), "src", "public", "images");
const CURRENCY = "₹";

const DEFAULT_FONTS = {
  Normal: path.join(process.cwd(), "src", "public", "fonts", "montserrat.ttf"),
  Bold: path.join(
    process.cwd(),
    "src",
    "public",
    "fonts",
    "montserrat.bold.ttf",
  ),
  Heading: path.join(
    process.cwd(),
    "src",
    "public",
    "fonts",
    "PlayfairDisplay.ttf",
  ),
  SemiBold: path.join(
    process.cwd(),
    "src",
    "public",
    "fonts",
    "montserrat.semibold.ttf",
  ),
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
    .text(`ORIGINAL FOR RECIPIENT`, doc.x, IMAGE_HEIGHT, {
      align: "right",
      underline: true,
    })
    .font("normal")
    .text(
      `${Array.isArray(company.phone) ? company.phone.join(" / ") : company.phone}`,
      doc.x,
      doc.y + 2,
      { align: "right" },
    )
    .font("bold")
    .text(`HM.No.: `, doc.x, doc.y - 10, { align: "left", continued: true })
    .font("normal")
    .text(`${company.hallMarkNumber || ""}`)
    .font("semiBold")
    .fontSize(12)
    .text(`GST INVOICE`, doc.x, doc.y - 15, {
      align: "center",
      underline: true,
    })
    .moveDown();

  // Brand & hallmark logos (skip gracefully if missing)
  const brandPath = path.join(IMAGE_PATH, "brand.png");
  const hallmarkPath = path.join(IMAGE_PATH, "hallmark.png");

  // if (fs.existsSync(brandPath)) {
  //   doc.image(brandPath, MARGIN, IMAGE_HEIGHT, { width: 130, align: "right" });
  // }
  if (fs.existsSync(hallmarkPath)) {
    doc.image(hallmarkPath, MARGIN, IMAGE_HEIGHT, {
      width: 130,
      align: "left",
    });
  }

  const getFullAddress = (address) => {
    if (!address) return "";
    // If it's an object
    const parts = [
      address.street,
      address.city,
      address.state,
      address.pincode,
    ];

    return [
      address.street,
      `${address.city}, ${address.state} - ${address.pincode}`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  doc
    .fontSize(24)
    .font("heading")
    .text(company.name.toUpperCase(), { align: "center" })
    .font("normal")
    .fontSize(12)
    .text(getFullAddress(company.address), { align: "center" })
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

  //consignie divider
  doc
    .moveTo(320, COLUMN_HEIGHT - 10)
    .lineWidth(0.5)
    .lineTo(320, doc.y+1)
    .stroke();

  const infoY = COLUMN_HEIGHT;
  let date = invoice.createdAt;

  doc
    .font("bold")
    .text("Bill No: ", 325, infoY, { continued: true })
    .font("normal")
    .text(invoice.invoiceNumber);

  const displayDate = date
    ? new Date(date).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");
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
    .lineWidth(0.5)
    .lineTo(doc.page.width - 7, doc.y + 5)
    .stroke();

  doc.font("bold").text("Consignee Details :", 325, doc.y + 6);

  doc
    .moveTo(320, doc.y + 2)
    .lineWidth(0.5)
    .lineTo(doc.page.width - 7, doc.y + 2)
    .stroke();

  doc
    .font("bold")
    .text(`${invoice.customer.name}`, 325, doc.y + 5)
    .font("normal")
    .text(`${invoice.customer.address || ""}`, 325, doc.y + 10)
    .text(`Ph # ${invoice.customer.phone || ""}`, 325, doc.y + 10);

  doc.y = COLUMN_HEIGHT + 120;
};

// ─── Items Table ─────────────────────────────────────────────────────────────

const formatMoney = (value) => {
  const num = Number(value);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const formatMoneyDisplay = (value) => {
  const num = Number(value);
  return isNaN(num)
    ? "0.00"
    : num.toLocaleString("en-IN", { minimumFractionDigits: 2 });
};

const roundOff = (total) => {
  const roundedTotal = Math.round(total);
  const roundOffValue = +(roundedTotal - total).toFixed(2);
  const diff = +(roundedTotal - total).toFixed(2);

  return {
    display: diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2),
    roundedTotal,
    roundOff: roundOffValue,
  };
};

const categories = { GOLD: "G", SILVER: "S", DIAMOND: "D" };

const calculateGST = (value, gstPercentage) => (value * gstPercentage) / 100;

const calculateTotal = (rows, columnIndex) =>
  rows
    .reduce((sum, row) => sum + parseFloat(row[columnIndex] || 0), 0)
    .toFixed(2);

const generateItemsTable = (doc, invoice) => {
  const tableConfig = {
    headers: [
      { text: "Type", width: 30, align: "center" },
      { text: "Description", width: 80, align: "center" },
      { text: "HSN Code", width: 35, align: "center" },
      { text: "Purity", width: 45, align: "center" },
      { text: "Gross Wt", width: 40, align: "center" },
      { text: "Rate", width: 60, align: "center" },
      { text: "Value", width: 70, align: "center" },
      { text: "Making Charges", width: 60, align: "center" },
      { text: "Other", width: 40, align: "center" },
      { text: "Amount", width: 100, align: "center" },
    ],
    columnSpacing: 2,
    rowHeight: 20,
    headerHeight: 30,
    margin: { left: 10, top: doc.y, right: 10 },
  };

  tableConfig.rows = (invoice.items || []).map((item) => {
    const totalRate = Number(item.total) || 0;
    const makingCharges = (totalRate * item.makingCharges) / 100;
    const totalCharges = parseFloat(
      totalRate + makingCharges + (item.otherCharges || 0),
    ).toFixed(2);

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
  const { headers, rows, margin, rowHeight, headerHeight, columnSpacing } =
    config;

  config.totalWidth =
    headers.reduce((sum, header) => sum + header.width + columnSpacing, 0) -
    columnSpacing;

  // Customer info box outline
  doc
    .moveTo(margin.left, margin.top - 130)
    .lineTo(margin.left + config.totalWidth, margin.top - 130)
    .lineTo(margin.left + config.totalWidth, margin.top)
    .lineTo(margin.left, margin.top)
    .lineTo(margin.left, margin.top - 130)
    .lineWidth(0.5)
    .stroke();

  doc
    .rect(margin.left, margin.top, config.totalWidth, headerHeight)
    .lineWidth(0.5)
    .stroke(); // light header

  let x = margin.left;
  doc.font("bold");

  headers.forEach((header) => {
    doc.font("semiBold").fontSize(9.5).moveTo(x, margin.top);
    // .lineTo(x, margin.top + headerHeight + rows.length * rowHeight)
    // .stroke();

    doc.text(header.text.toUpperCase(), x + 2, margin.top + 5, {
      width: header.width - 4,
      align: header.align,
    });

    x += header.width + columnSpacing;
  });

  doc
    .moveTo(x - columnSpacing, margin.top)
    .lineTo(
      x - columnSpacing,
      margin.top + headerHeight + rows.length * rowHeight,
    )
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
      if (colIndex >= 5) {
        doc.font("semiBold");
      } else {
        doc.font("normal");
      }
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
  let y =
    margin.top +
    config.headerHeight +
    config.rows.length * rowHeight +
    rowHeight;

  doc
    .moveTo(margin.left, margin.top)
    .lineTo(margin.left, y + 105)
    .stroke();
  doc
    .moveTo(margin.left + totalWidth, margin.top)
    .lineTo(margin.left + totalWidth, y + 105)
    .stroke();

  doc.font("bold");

  y -= 10;
  doc.text("Total", margin.left + 2, y, { align: "left" });
  doc.text(calculateTotal(config.rows, 4), margin.left + 210, y, {
    align: "left",
  });
  doc.text(calculateTotal(config.rows, 7), margin.left + 385, y, {
    align: "left",
  });
  doc.text(formatMoney(totalAmount), margin.left + totalWidth - 62, y, {
    align: "right",
  });

  doc
    .moveTo(margin.left, y + 15)
    .lineTo(margin.left + totalWidth, y + 15)
    .stroke();

  y += rowHeight;
  const gstAmount = calculateGST(totalAmount, 1.5);

  doc.text("CGST: 1.50%", margin.left, y, {
    width: totalWidth - 90,
    align: "right",
  });
  doc.text(formatMoney(gstAmount), margin.left + totalWidth - 62, y, {
    align: "right",
  });

  y += rowHeight;
  doc.text("SGST: 1.50%", margin.left, y, {
    width: totalWidth - 90,
    align: "right",
  });

  doc
    .moveTo(margin.left + totalWidth - 80, margin.top)
    .lineTo(margin.left + totalWidth - 80, y + 35)
    .stroke();

  doc.text(formatMoney(gstAmount), margin.left + totalWidth - 62, y, {
    align: "right",
  });

  doc
    .moveTo(margin.left, y + 15)
    .lineTo(margin.left + totalWidth, y + 15)
    .stroke();

  y += rowHeight;
  doc.text("Total Amt. With Tax.", margin.left, y, {
    width: totalWidth - 90,
    align: "right",
  });

  doc
    .moveTo(margin.left + totalWidth - 80, margin.top)
    .lineTo(margin.left + totalWidth - 80, y + 55)
    .stroke();

  doc.text(formatMoneyDisplay(formatMoney(totalWithGST)), margin.left + totalWidth - 62, y, {
    align: "right",
  });

  doc
    .moveTo(margin.left, y + 15)
    .lineTo(margin.left + totalWidth, y + 15)
    .stroke();

  y += rowHeight;
  doc.font("semiBold").text("Round Off", margin.left, y, {
    width: totalWidth - 90,
    align: "right",
  });

  doc.font("bold");
  doc.text(
    `${roundOff(totalWithGST).display}`,
    margin.left + totalWidth - 62,
    y,
    {
      align: "right",
    },
  );

  doc
    .moveTo(margin.left, y + 15)
    .lineTo(margin.left + totalWidth, y + 15)
    .stroke();

  y += rowHeight;
  //-----------------------------------------------------------------
  // doc
  // .fontSize(11)
  // .font("bold")
  // .text(
  //   `${CURRENCY} ${formatMoneyDisplay(roundOff(totalWithGST).roundedTotal)}`,
  //   margin.left,
  //   y,
  //   {
  //     align: "right",
  //   },
  // );

  // doc.fontSize(10).font("bold").text("Final Amount", margin.left, y, {
  //   width: totalWidth - 90,
  //   align: "right",
  // });

  doc
    .fontSize(8)
    .text(
      "Amounts in words: " +
        convertAmountToIndianWords(roundOff(totalWithGST).roundedTotal),
      margin.left + 2,
      y,
    );

  doc
    .moveTo(margin.left, y + 15)
    .lineTo(margin.left + totalWidth, y + 15)
    .stroke();


    y += rowHeight + 5;
const finalAmount = roundOff(totalWithGST).roundedTotal;
  // Draw box aligned to table
doc
  .rect(margin.left, y, totalWidth, 25)
  .lineWidth(1)
  .stroke();

// Center text INSIDE box (no overflow)
doc
  .font("bold")
  .fontSize(12)
  .text(
    `FINAL AMOUNT: ${CURRENCY} ${formatMoneyDisplay(finalAmount)}`,
    margin.left,
    y + 7,
    {
      width: totalWidth,
      align: "center",
    }
  );
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
    .text(`FOR ${company.name.toUpperCase()}`, { align: "right" })
    .moveDown(10)
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
      .lineWidth(0.5)
      .stroke();

    doc
      .moveTo(15, HEIGHT)
      .fontSize(8)
      .text("Bank Details:", LEFT + 70, HEIGHT + 10, { underline: true })
      .text(`Bank Name: ${company.bank.bankName}`, LEFT + 10, HEIGHT + 22)
      .text(`Branch: ${company.bank.branch}`)
      .text(`A/c No: ${company.bank.accountNumber}`)
      .text(`IFSC Code: ${company.bank.ifsc}`);
  }

  doc
  .moveDown(2)
  .font("heading")
  .fontSize(10)
  .text("Crafted with Trust • Delivered with Purity", { align: "center" })
  .moveDown(0.3)
  .font("normal")
  .fontSize(9)
  .text("Thank you for your purchase", { align: "center" })
  .moveDown(1.5);
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
    doc.registerFont("heading", DEFAULT_FONTS.Heading);
    doc.registerFont("semiBold", DEFAULT_FONTS.SemiBold);
  } else {
    doc.registerFont("normal", "Helvetica");
    doc.registerFont("bold", "Helvetica-Bold");
  }

  const fileName = `${invoice.invoiceNumber}.pdf`;
  const filePath = path.join(
    process.cwd(),
    "src",
    "public",
    "invoices",
    fileName,
  );

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
