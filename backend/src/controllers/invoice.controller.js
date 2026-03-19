import { errorResponse, successResponse } from "../response/response.js";
import { saveInvoiceInDB, updateInvoiceFilePath } from "../services/invoice.service.js";
import { createPDF } from "../services/pdf.service.js";
import { logger } from "../utils/logger.js";
import fs from "fs";

export const generateInvoice = async (req, res) => {
  let filePath;
  try {
    logger.info("Generate invoice for tenant: " + req.user.userId);
    const { userId } = req.user;

    // 1. Save invoice to DB (returns invoice object with populated _company)
    const invoice = await saveInvoiceInDB(userId, req.body);

    // 2. Generate the PDF
    const result = await createPDF(invoice);
    filePath = result.filePath;
    logger.info("Generate invoice filepath " + filePath);
    const fileName = result.fileName;

    // 3. Persist the filePath back onto the invoice record
    await updateInvoiceFilePath(invoice.invoiceNumber, filePath);

    // 4. Stream PDF to client, then clean up temp file
    res.download(filePath, fileName, (err) => {
      if (err) {
        logger.error("Error sending PDF: " + err);
      }
      // Clean up: delete file after sending (optional — remove if you want to keep files)
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) logger.warn("Could not delete temp PDF: " + unlinkErr);
      });
    });
  } catch (err) {
    console.log(err);
    // Clean up file if it was created before the error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return errorResponse(res, 400, "unable to generate invoice", { message: err.message });
  }
};

// Get all invoices for the tenant (bonus endpoint)
export const getInvoices = async (req, res) => {
  try {
    const InvoiceModel = (await import("../model/invoice.model.js")).default;
    const invoices = await InvoiceModel.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    return successResponse(res, 200, "Invoices fetched", invoices);
  } catch (err) {
    console.log(err);
    return errorResponse(res, 400, "Unable to fetch invoices", { message: err.message });
  }
};
