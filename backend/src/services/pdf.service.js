import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import CompanyModel from "../model/companyModel.js";
import { convertAmountToIndianWords } from "../utils/converision.js";
import { logger } from "../utils/logger.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const IMAGE_PATH = path.join(process.cwd(), "src", "public", "images");
const CURRENCY = "₹";

const COL = {
  TYPE: 0,
  NAME: 1,
  HSN: 2,
  KARAT: 3,
  QTY: 4,
  GROSS_WT: 5,
  METAL_WT: 6,
  RATE: 7,
  MAKING: 8,
  SGST: 9,
  CGST: 10,
  AMOUNT: 11,
};

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

// ─── Page layout ──────────────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 28;
const CONTENT_W = PAGE_W - M * 2; // 539.28
const FOOTER_H = 175; // tightened since rate band + some fields removed

// ─── Palette ──────────────────────────────────────────────────────────────────
const CLR = {
  black: "#1A1A1A",
  dark: "#2D2D2D",
  mid: "#555555",
  light: "#888888",
  rule: "#CCCCCC",
  ruleHard: "#AAAAAA",
  gold: "#A0813A",
  bgHead: "#F5F5F5",
  bgStripe: "#FAFAFA",
  white: "#FFFFFF",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v) => {
  const n = Number(v);
  return isNaN(n) ? "0.00" : n.toFixed(2);
};
const fmtIN = (v) => {
  const n = Number(v);
  return isNaN(n)
    ? "0.00"
    : n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
};

const getGSTRate = (inv, co) => inv.gstRate ?? co?.gstRate ?? 1.5;
const calcGST = (val, r) => (val * r) / 100;
const colTotal = (rows, ci) =>
  rows.reduce((s, r) => s + parseFloat(r[ci] || 0), 0).toFixed(2);

const roundOff = (total) => {
  const rounded = Math.round(total);
  const diff = +(rounded - total).toFixed(2);
  return {
    display: diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2),
    rounded,
    diff,
  };
};

const fmtDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const fmtYear = (d) => {
  const y = new Date(d || Date.now()).getFullYear();
  return `${y}-${y + 1}`;
};

const fullAddr = (a) => {
  if (!a) return "";
  return [a.street, [a.city, a.state, a.pincode].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(", ");
};

const categories = { GOLD: "G", SILVER: "S", DIAMOND: "D" };

// ─── Font registration ────────────────────────────────────────────────────────
const registerFonts = (doc) => {
  const ok = Object.values(DEFAULT_FONTS).every(fs.existsSync);
  if (ok) {
    doc.registerFont("normal", DEFAULT_FONTS.Normal);
    doc.registerFont("bold", DEFAULT_FONTS.Bold);
    doc.registerFont("heading", DEFAULT_FONTS.Heading);
    doc.registerFont("semiBold", DEFAULT_FONTS.SemiBold);
  } else {
    doc.registerFont("normal", "Helvetica");
    doc.registerFont("bold", "Helvetica-Bold");
    doc.registerFont("heading", "Helvetica-Bold");
    doc.registerFont("semiBold", "Helvetica-Bold");
  }
};

// ─── Drawing primitives ───────────────────────────────────────────────────────
const hline = (doc, y, x1 = M, x2 = PAGE_W - M, lw = 0.4, col = CLR.rule) =>
  doc
    .save()
    .strokeColor(col)
    .lineWidth(lw)
    .moveTo(x1, y)
    .lineTo(x2, y)
    .stroke()
    .restore();

const vline = (doc, x, y1, y2, lw = 0.4, col = CLR.rule) =>
  doc
    .save()
    .strokeColor(col)
    .lineWidth(lw)
    .moveTo(x, y1)
    .lineTo(x, y2)
    .stroke()
    .restore();

const fillRect = (doc, x, y, w, h, fill) =>
  doc.save().fillColor(fill).rect(x, y, w, h).fill().restore();

const strokeRect = (doc, x, y, w, h, col = CLR.rule, lw = 0.4) =>
  doc.save().strokeColor(col).lineWidth(lw).rect(x, y, w, h).stroke().restore();

// ─── 1. HEADER ───────────────────────────────────────────────────────────────
// Removed: gold top rule, monogram circle, tagline, address line, GSTIN line
// Kept:    "CUSTOMER COPY" stamp, brand name (centred), GST INVOICE badge, bottom rule
const generateHeader = (doc, company) => {
  let y = M;

  // "CUSTOMER COPY" stamp — top right
  doc
    .font("bold")
    .fontSize(7)
    .fillColor(CLR.light)
    .text("CUSTOMER COPY", PAGE_W - M - 72, y, { lineBreak: false });

  // GST INVOICE gold badge — centred
  const badgeW = 82,
    badgeH = 14;
  const bx = PAGE_W / 2 - badgeW / 2;
  fillRect(doc, bx, y, badgeW, badgeH, CLR.gold);
  doc
    .font("bold")
    .fontSize(7.5)
    .fillColor(CLR.white)
    .text("GST  INVOICE", bx, y + 3.5, { width: badgeW, align: "center" });

  y += badgeH + 8;

  // Brand name — centred, full width
  doc
    .font("heading")
    .fontSize(20)
    .fillColor(CLR.black)
    .text(company.name.toUpperCase(), M, y + 3, {
      width: CONTENT_W,
      align: "center",
      lineBreak: false,
    });

  y += 30; // brand name height

  // Section bottom rule
  hline(doc, y + 10, M, PAGE_W - M, 0.6, CLR.ruleHard);
  doc.y = y + 15;
};

// ─── 2. SELLER + CUSTOMER INFO ────────────────────────────────────────────────
// No changes — kept exactly as-is
const generateCustomerInfo = (doc, invoice, company) => {
  const topY = doc.y;
  const midX = PAGE_W / 2 + 2;

  // ── LEFT: Seller
  doc
    .font("bold")
    .fontSize(7)
    .fillColor(CLR.light)
    .text("TAX INVOICE", M, topY, { lineBreak: false });
  doc
    .font("bold")
    .fontSize(7)
    .fillColor(CLR.dark)
    .text(`  |  ${invoice.invoiceNumber ?? ""}`, doc.x, topY, {
      lineBreak: false,
    });

  let ly = topY + 11;
  doc.font("bold").fontSize(9).fillColor(CLR.black).text(company.name, M, ly);
  ly = doc.y + 1;

  const phone = Array.isArray(company.phone)
    ? company.phone.join(" / ")
    : (company.phone ?? "");
  const sellerLines = [
    fullAddr(company.address),
    `Ph: ${phone}`,
    `GSTIN: ${company.gstin ?? ""}`,
    `HM No.: ${company.hallMarkNumber ?? ""}  |  State Code: ${company.address?.statecode ?? "20"}`,
    `Email: ${company.email ?? ""}`,
  ];
  sellerLines.forEach((line) => {
    doc
      .font("normal")
      .fontSize(7.5)
      .fillColor(CLR.mid)
      .text(line, M, ly, { width: midX - M - 10 });
    ly = doc.y + 1;
  });
  const leftEndY = ly;

  // ── RIGHT: Doc info + Customer
  let ry = topY;
  doc
    .font("bold")
    .fontSize(7.5)
    .fillColor(CLR.dark)
    .text(invoice.invoiceNumber ?? "", midX, ry, { lineBreak: false });
  doc
    .font("normal")
    .fontSize(7)
    .fillColor(CLR.mid)
    .text(
      `   Date: ${fmtDate(invoice.createdAt)}   |   Year: ${fmtYear(invoice.createdAt)}`,
      doc.x,
      ry,
      { lineBreak: false },
    );

  ry += 13;
  doc
    .font("bold")
    .fontSize(7)
    .fillColor(CLR.light)
    .text("CUSTOMER DETAILS", midX, ry);
  ry = doc.y + 2;

  doc
    .font("bold")
    .fontSize(9)
    .fillColor(CLR.black)
    .text(invoice.customer?.name ?? "", midX, ry);
  ry = doc.y + 1;

  const custLines = [
    invoice.customer?.address ?? "",
    `State: ${company.address?.state ?? ""}  |  Code: ${company.address?.statecode ?? ""}`,
    `Ph: ${invoice.customer?.phone ?? ""}`,
  ];
  custLines.forEach((line) => {
    doc
      .font("normal")
      .fontSize(7.5)
      .fillColor(CLR.mid)
      .text(line, midX, ry, { width: PAGE_W - M - midX - 4 });
    ry = doc.y + 1;
  });
  const rightEndY = ry;

  const sectionH = Math.max(leftEndY, rightEndY) - topY + 6;

  // Vertical divider between columns
  vline(doc, midX - 4, topY - 5, topY + sectionH + 5, 0.4, CLR.rule);

  hline(doc, topY + sectionH + 5, M, PAGE_W - M, 0.6, CLR.ruleHard);
  doc.y = topY + sectionH + 20;
};

// ─── 3. ITEMS TABLE ──────────────────────────────────────────────────────────
const buildRows = (invoice, rate) =>
  (invoice.items ?? []).map((item) => {
    const metalVal = Number(item.total) || 0;
    const makingCharges = Number(item.makingCharges) || 0;
    const baseAmount = metalVal + makingCharges;
    const gst = calcGST(baseAmount, rate);
    const grossWt = Number(item.weight ?? 0).toFixed(3);
    const metalWt = Number(item.weight ?? 0).toFixed(3);
    const goldRate = Number(item.rate * 10) ?? 0;
    // const rate = Number(item.rate ?? 0)

    return [
      categories[item.category] ?? "", // COL.TYPE    0
      item.name ?? "", // COL.NAME    1
      item.hsnNumber ?? "", // COL.HSN     2
      item.karat ?? "", // COL.KARAT   3
      `${item.quantity ?? 1}N`, // COL.QTY     4
      grossWt, // COL.GROSS_WT 5
      metalWt, // COL.METAL_WT 7
      goldRate, // COL.STONE_WT 6  (kept in data, not shown)
      fmt(makingCharges), // COL.MAKING  8
      fmt(gst), // COL.SGST    9
      fmt(gst), // COL.CGST    10
      fmt(baseAmount + gst * 2 + item.otherCharges), // COL.AMOUNT  11
    ];
  });

const generateItemsTable = (doc, invoice, company) => {
  const rate = getGSTRate(invoice, company);
  const rows = buildRows(invoice, rate);

  // 11 visible columns (Net Stone Wt removed)
  // Widths must sum to CONTENT_W = 539.28
  const cols = [
    { label: "Type", w: 30, align: "center" },
    { label: "HSN", w: 28, align: "center" },
    { label: "Product Description", w: 85, align: "center" },
    { label: "Purity", w: 36, align: "center" },
    { label: "Qty", w: 20, align: "center" },
    { label: "Gross\nWt (g)", w: 38, align: "center" },
    { label: "Net\nWt (g)", w: 38, align: "center" },
    { label: "Rate\n(₹/10g)", w: 40, align: "right" },
    { label: "Making\nChgs (₹)", w: 44, align: "right" },
    { label: "CGST\n1.50%", w: 40, align: "right" },
    { label: "SGST\n1.50%", w: 40, align: "right" },
    { label: "Product Value (₹)", w: 100, align: "right" }, // last col stretched below
  ];
  // Stretch last column to fill exactly
  cols[cols.length - 1].w += CONTENT_W + 16 - cols.reduce((s, c) => s + c.w, 0);

  // Display row — skip STONE_WT (COL 6), keep everything else in order
  const displayRows = rows.map((r) => [
    r[COL.TYPE], // 0
    r[COL.HSN], // 1
    r[COL.NAME], // 2
    r[COL.KARAT], // 3
    r[COL.QTY], // 4
    r[COL.GROSS_WT], // 5
    r[COL.METAL_WT], // 6
    r[COL.RATE], // 7  (was 7 — stone wt skipped)
    r[COL.MAKING], // 8
    r[COL.SGST], // 9
    r[COL.CGST], // 10
    r[COL.AMOUNT], // 11
  ]);

  const HEADER_H = 26;
  const ROW_H = 20;
  const tableX = M - 8;
  const tableW = CONTENT_W + 16;
  let y = doc.y;
  const tableTop = y;

  // ── Header
  fillRect(doc, tableX, y, tableW, HEADER_H, CLR.bgHead);
  hline(doc, y + HEADER_H, tableX, tableX + tableW, 0.8, CLR.ruleHard);

  let x = tableX;
  cols.forEach((col) => {
    const lines = col.label.split("\n");
    const lineH = 8.5;
    const totalH = lines.length * lineH;
    let ty = y + (HEADER_H - totalH) / 2 + 1;
    lines.forEach((line) => {
      doc
        .font("bold")
        .fontSize(6.5)
        .fillColor(CLR.dark)
        .text(line, x + 2, ty, {
          width: col.w - 4,
          align: col.align,
          lineBreak: false,
        });
      ty += lineH;
    });
    x += col.w;
  });

  // ── Data rows
  y += HEADER_H;
  displayRows.forEach((row, ri) => {
    fillRect(
      doc,
      tableX,
      y,
      tableW,
      ROW_H,
      ri % 2 === 0 ? CLR.white : CLR.bgStripe,
    );
    hline(doc, y, tableX, tableX + tableW, 0.3, CLR.rule);

    x = tableX;
    cols.forEach((col, ci) => {
      // Bold numeric cols from Making onwards (ci >= 7 in 11-col layout)
      doc
        .font(ci >= 7 ? "semiBold" : "normal")
        .fontSize(8)
        .fillColor(CLR.dark)
        .text(String(row[ci] ?? ""), x + 3, y + 6, {
          width: col.w - 6,
          align: col.align,
          lineBreak: false,
        });
      x += col.w;
    });
    y += ROW_H;
  });

  // ── Totals row
  fillRect(doc, tableX, y, tableW, ROW_H, CLR.bgHead);
  hline(doc, y, tableX, tableX + tableW, 0.8, CLR.ruleHard);

  const totalItems = displayRows.length;
  const totalGrossW = parseFloat(colTotal(rows, COL.GROSS_WT)).toFixed(3);
  const totalAmt = parseFloat(colTotal(rows, COL.AMOUNT));

  // "Total" label
  doc
    .font("bold")
    .fontSize(8)
    .fillColor(CLR.dark)
    .text("Total", tableX + 3, y + 6, { lineBreak: false });

  // Qty total — right-aligned inside first 5 cols
  doc
    .font("bold")
    .fontSize(8)
    .fillColor(CLR.dark)
    .text(`${totalItems}N`, tableX + 3, y + 6, {
      width: cols.slice(0, 5).reduce((s, c) => s + c.w, 0) - 6,
      align: "right",
      lineBreak: false,
    });

  // Gross wt total — right-aligned inside first 6 cols
  doc
    .font("bold")
    .fontSize(8)
    .fillColor(CLR.dark)
    .text(totalGrossW, tableX + 3, y + 6, {
      width: cols.slice(0, 6).reduce((s, c) => s + c.w, 0) - 6,
      align: "right",
      lineBreak: false,
    });

  // Amount total — right-aligned to full width
  doc
    .font("bold")
    .fontSize(8)
    .fillColor(CLR.dark)
    .text(fmtIN(totalAmt), tableX + 3, y + 6, {
      width: tableW - 6,
      align: "right",
      lineBreak: false,
    });

  y += ROW_H;
  hline(doc, y, tableX, tableX + tableW, 0.8, CLR.ruleHard);

  // Outer border + vertical column dividers (full table height)
  strokeRect(doc, tableX, tableTop, tableW, y - tableTop, CLR.ruleHard, 0.5);
  x = tableX;
  cols.slice(0, -1).forEach((col) => {
    x += col.w;
    vline(doc, x, tableTop, y, 0.3, CLR.rule);
  });

  doc.y = y + 10;

  // ── Totals calculation
  const otherChargesTotal = invoice.items.reduce((sum, i)=>(sum + i.otherCharges), 0)
  const netInvoice = totalAmt;
  const rateMulti = 1 + (rate / 100) * 2;
  const preGSTTotal = (netInvoice - otherChargesTotal) / rateMulti;
  const gstAmt = calcGST(preGSTTotal, rate);
  const rounded = roundOff(netInvoice);

  drawTotalsSection(doc, {
    tableX,
    tableW,
    rate,
    preGSTTotal,
    gstAmt,
    rounded,
    rows,
    invoice,
  });

  return rounded.rounded;
};

// ─── 4. TOTALS SECTION ───────────────────────────────────────────────────────
const drawTotalsSection = (
  doc,
  { tableX, tableW, rate, preGSTTotal, gstAmt, rounded, rows, invoice },
) => {
  const y0 = doc.y;
  const leftW = tableW * 0.55;
  const rightW = tableW - leftW;
  const rightX = tableX + leftW;

  // ── LEFT: Payment details (3 columns)
  doc
    .font("bold")
    .fontSize(7)
    .fillColor(CLR.light)
    .text("PAYMENT DETAILS", tableX + 4, y0);

  const PAY_H = 15;
  const payTop = doc.y + 2;

  // 3 cols — widths must sum to leftW
  const payCols = [
    { label: "Payment Mode", w: leftW * 0.35 },
    { label: "Customer", w: leftW * 0.38 },
    { label: "Amount (₹)", w: leftW * 0.27 },
  ];
  // Stretch last pay col to fill exactly
  payCols[payCols.length - 1].w += leftW - payCols.reduce((s, c) => s + c.w, 0);

  // Pay header
  fillRect(doc, tableX, payTop, leftW, PAY_H, CLR.bgHead);
  hline(doc, payTop + PAY_H, tableX, tableX + leftW, 0.5, CLR.ruleHard);
  strokeRect(doc, tableX, payTop, leftW, PAY_H * 3, CLR.rule, 0.4);

  let px = tableX;
  payCols.forEach((pc) => {
    doc
      .font("bold")
      .fontSize(6.5)
      .fillColor(CLR.dark)
      .text(pc.label, px + 2, payTop + 4.5, {
        width: pc.w - 4,
        align: "center",
        lineBreak: false,
      });
    px += pc.w;
  });

  const custName = invoice.customer?.name ?? "";
  const payData = ["Cash/UPI", custName, fmtIN(rounded.rounded)];
  const payTotR = ["Total Amount Paid", "", fmtIN(rounded.rounded)];

  [payData, payTotR].forEach((row, ri) => {
    const rowY = payTop + PAY_H + ri * PAY_H;
    if (ri === 1) {
      fillRect(doc, tableX, rowY, leftW, PAY_H, CLR.bgHead);
      hline(doc, rowY, tableX, tableX + leftW, 0.5, CLR.ruleHard);
    }
    px = tableX;
    payCols.forEach((pc, ci) => {
      doc
        .font(ri === 1 ? "bold" : "normal")
        .fontSize(7.5)
        .fillColor(CLR.dark)
        .text(String(row[ci] ?? ""), px + 2, rowY + 4, {
          width: pc.w - 4,
          align: "center",
          lineBreak: false,
        });
      px += pc.w;
    });
  });

  // ── RIGHT: Charges breakdown (no Scheme Discount row)
  const chargeRows = [
    {
      label: "Taxable Amount",
      val: `${CURRENCY} ${fmtIN(preGSTTotal)}`,
      bold: false,
    },
    {
      label: `CGST @ ${rate.toFixed(2)}%`,
      val: `${CURRENCY} ${fmtIN(gstAmt)}`,
      bold: false,
    },
    {
      label: `SGST @ ${rate.toFixed(2)}%`,
      val: `${CURRENCY} ${fmtIN(gstAmt)}`,
      bold: false,
    },
    {
      label: "Other Charges",
      val: `${CURRENCY} ${invoice.items.reduce((sum, i)=>{return sum + i.otherCharges}, 0)}`,
      bold: false,
    },
    { label: "Round Off", val: `${CURRENCY} ${rounded.display}`, bold: false },
    {
      label: "Total Amount to be Paid",
      val: `${CURRENCY} ${fmtIN(rounded.rounded)}`,
      bold: true,
    },
  ];

  const CR_H = 15;

  chargeRows.forEach((cr, i) => {
    let cry = y0 + i * CR_H;
    const isLast = i === chargeRows.length - 1;

    if (isLast) {
      cry += 10;
      fillRect(doc, rightX, cry, rightW, CR_H + 2, CLR.bgHead);
      hline(doc, cry, rightX, rightX + rightW, 0.8, CLR.dark);
    }

    doc
      .font(cr.bold ? "bold" : "normal")
      .fontSize(isLast ? 8 : 7.5)
      .fillColor(isLast ? CLR.black : CLR.mid)
      .text(cr.label, rightX + 4, cry + (isLast ? 3 : 2), {
        width: rightW / 2,
        lineBreak: false,
      });

    doc
      .font(cr.bold ? "bold" : "semiBold")
      .fontSize(isLast ? 8 : 7.5)
      .fillColor(isLast ? CLR.black : CLR.dark)
      .text(cr.val, rightX + 4, cry + (isLast ? 3 : 2), {
        width: rightW - 8,
        align: "right",
        lineBreak: false,
      });

    if (isLast)
      hline(doc, cry + CR_H + 2, rightX, rightX + rightW, 0.8, CLR.dark);
  });

  const sectionBottom = y0 + chargeRows.length * CR_H + 6;

  // Divider between payment (left) and charges (right)
  vline(doc, rightX, y0 - 10, sectionBottom + 32, 0.4, CLR.rule);

  doc.y = sectionBottom + 10;

  // ── Amount in words
  doc
    .font("bold")
    .fontSize(7.5)
    .fillColor(CLR.dark)
    .text(
      `Value in Words:- ${convertAmountToIndianWords(rounded.rounded)}`,
      rightX + 4,
      sectionBottom + 10,
      { width: rightW - 8 },
    );

  doc.y = sectionBottom + 10;
  hline(doc, sectionBottom + 32, tableX, rightX + rightW, 0.8, CLR.ruleHard);
  doc.y += 4;
};

// ─── 5. FOOTER ───────────────────────────────────────────────────────────────
const generateFooter = (doc, company, invoice) => {
  const FOOTER_TOP = PAGE_H - FOOTER_H - 30;
  if (doc.y > FOOTER_TOP - 10) doc.addPage();
  doc.y = FOOTER_TOP;

  hline(doc, FOOTER_TOP, M, PAGE_W - M, 0.6, CLR.ruleHard);

  const tcW = CONTENT_W * 0.6;
  const sigW = CONTENT_W - tcW - 8;
  const sigX = M + tcW + 8;

  // ── Terms & Conditions
  doc
    .font("bold")
    .fontSize(7.5)
    .fillColor(CLR.dark)
    .text("Terms & Conditions:", M, FOOTER_TOP + 7);

  const terms = company.termsConditions ?? [];
  terms.forEach((term, i) => {
    doc
      .font("normal")
      .fontSize(6.5)
      .fillColor(CLR.mid)
      .text(`${i + 1}. ${term}`, M, doc.y + 1, { width: tcW - 4 });
  });

  // Customer name line (no signature line — removed)
  doc
    .font("normal")
    .fontSize(7)
    .fillColor(CLR.mid)
    .text(
      "Read & understood. Agreed to terms and conditions.",
      M,
      FOOTER_TOP + FOOTER_H - 45,
      { width: tcW },
    );
  doc
    .font("bold")
    .fontSize(7)
    .fillColor(CLR.dark)
    .text(`Customer: ${invoice?.customer?.name ?? ""}`, M, doc.y + 2);

  // ── Authorised signatory box
  const sigBoxY = FOOTER_TOP + 7;
  const sigBoxH = 72;
  strokeRect(doc, sigX, sigBoxY, sigW, sigBoxH, CLR.rule, 0.4);

  doc
    .font("bold")
    .fontSize(8)
    .fillColor(CLR.dark)
    .text(`For ${company.name}`, sigX, sigBoxY + 6, {
      width: sigW,
      align: "center",
    });

  const logoPath = path.join(IMAGE_PATH, "logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, sigX + sigW / 2 - 28, sigBoxY + 20, { width: 56 });
  }

  doc
    .font("normal")
    .fontSize(7)
    .fillColor(CLR.light)
    .text("Authorised Signatory", sigX, sigBoxY + sigBoxH - 12, {
      width: sigW,
      align: "center",
    });

  // ── Bank details box (height driven by field count)
  if (company.bank) {
    const bankFields = [
      { label: "Bank", value: company.bank.bankName ?? "" },
      { label: "Branch", value: company.bank.branch ?? "" },
      { label: "A/C No", value: company.bank.accountNumber ?? "" },
      { label: "Holder Name", value: company.bank.holderName ?? "" },
      { label: "IFSC", value: company.bank.ifsc ?? "" },
    ];
    const LINE_H = 12;
    const bankBoxH = 14 + bankFields.length * LINE_H + 4;
    const bankY = sigBoxY + sigBoxH + 5;

    strokeRect(doc, sigX, bankY, sigW, bankBoxH, CLR.rule, 0.4);
    doc
      .font("bold")
      .fontSize(7)
      .fillColor(CLR.dark)
      .text("Bank Details", sigX, bankY + 4, {
        width: sigW,
        align: "center",
        underline: true,
      });

    bankFields.forEach(({ label, value }, i) => {
      const fy = bankY + 14 + i * LINE_H;
      doc
        .font("bold")
        .fontSize(7)
        .fillColor(CLR.mid)
        .text(`${label}: `, sigX + 6, fy, {
          continued: true,
          lineBreak: false,
        });
      doc
        .font("normal")
        .fontSize(7)
        .fillColor(CLR.dark)
        .text(value, { lineBreak: false });
    });
  }
};

// ─── 6. Outer border ─────────────────────────────────────────────────────────
const drawOuterBorder = (doc) =>
  strokeRect(
    doc,
    M - 8,
    M - 8,
    PAGE_W - (M - 8) * 2,
    PAGE_H - (M - 8) * 2,
    CLR.rule,
    0.4,
  );

// ─── PUBLIC API ───────────────────────────────────────────────────────────────
const INVOICE_DIR = path.join(process.cwd(), "src", "public", "invoices");

export const createPDF = async (invoice, res = null) => {
  let company = invoice._company ?? null;
  if (!company) {
    company =
      (await CompanyModel.findOne({ _id: invoice.companyId }).lean()) ??
      (await CompanyModel.findById(invoice.companyId)
        .populate("address")
        .populate("bank")
        .lean());
  }
  if (!company) throw new Error("Company not found: " + invoice.companyId);

  const doc = new PDFDocument({ size: "A4", margin: 0, layout: "portrait" });
  registerFonts(doc);

  const fileName = `${invoice.invoiceNumber}.pdf`;
  let filePath = null;
  let diskStream = null;
  let fullPath = null;
  let companyId = company._id.toString()

  if (res) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    doc.pipe(res);
  } else {
    fullPath = path.join(INVOICE_DIR, companyId, fileName);
    fullPath = fullPath;
    logger.info("File path for invoice " + fullPath);
    filePath = `invoices/${companyId}/${fileName}`;
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    diskStream = fs.createWriteStream(fullPath);
    doc.pipe(diskStream);
  }

  try {
    doc.y = M;
    generateHeader(doc, company);
    generateCustomerInfo(doc, invoice, company);
    generateItemsTable(doc, invoice, company);
    generateFooter(doc, company, invoice);
    drawOuterBorder(doc);
  } finally {
    doc.end();
  }

  if (diskStream) {
    await new Promise((resolve, reject) => {
      diskStream.on("finish", resolve);
      diskStream.on("error", reject);
    });
    return { fullPath, filePath, fileName, companyId: company._id };
  }

  return { fileName };
};
