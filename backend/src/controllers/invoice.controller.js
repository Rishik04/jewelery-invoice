import InvoiceModel from "../model/invoice.model.js";
import { errorResponse, successResponse } from "../response/response.js";
import {
  cancelInvoiceService,
  getInvoicesWithPageNumber,
  saveInvoiceInDB,
  updateInvoiceFilePath,
} from "../services/invoice.service.js";
import { createPDF } from "../services/pdf.service.js";
import { logger } from "../utils/logger.js";
import fs from "fs";

export const generateInvoice = async (req, res) => {
  let filePath;
  try {
    logger.info("Generate invoice for tenant: " + req.user.userId);
    const { userId } = req.user;
    const invoice = await saveInvoiceInDB(userId, req.body);

    // 2. Generate the PDF
    const result = await createPDF(invoice);
    filePath = result.filePath;
    const fullPath = result.fullPath;
    logger.info("Generate invoice filepath " + filePath);
    const fileName = result.fileName;

    await updateInvoiceFilePath(invoice.invoiceNumber, filePath);

    // 4. Stream PDF to client, then clean up temp file
    res.download(fullPath, fileName, (err) => {
      if (err) {
        logger.error("Error sending PDF: " + err);
      }
    });
  } catch (err) {
    console.log(err);
    // Clean up file if it was created before the error
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return errorResponse(res, 400, "unable to generate invoice", {
      message: err.message,
    });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getInvoicesWithPageNumber(page, limit);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

export const cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return errorResponse(res, 400, "Invoice ID is required");
    }
    logger.info("Cancel with invoice id " + id);
    const invoice = await cancelInvoiceService(id);
    if (!invoice) {
      return errorResponse(res, 404, "Invoice not found or already cancelled");
    }
    return successResponse(res, 200, "Invoice cancelled successfully", invoice);
  } catch (err) {
    return errorResponse(res, 500, "Unable to cancel invoice", {
      error: err,
      message: err.message,
    });
  }
};
