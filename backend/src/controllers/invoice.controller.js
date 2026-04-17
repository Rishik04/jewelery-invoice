import InvoiceModel from "../model/invoice.model.js";
import { errorResponse, successResponse } from "../response/response.js";
import {
  cancelInvoiceService,
  downloadInvoicesService,
  getInvoicesByIdService,
  getInvoicesWithPageNumber,
  saveInvoiceInDB,
  updateInvoiceFilePath,
} from "../services/invoice.service.js";
import { createPDF } from "../services/pdf.service.js";
import { logger } from "../utils/logger.js";
import fs from "fs";
import path from "path";

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

    await updateInvoiceFilePath(invoice.invoiceNumber, filePath, result.companyId);

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
    const userId = req.user.userId;

    const result = await getInvoicesWithPageNumber(page, limit, userId);

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

export const downloadInvoices = async (req, res) => {
  try {
    const { fy, month } = req.query;
    const userId = req.user.userId;

    if (!fy || !month) {
      return res.status(400).json({
        message: "FY and month are required",
      });
    }
    await downloadInvoicesService({
      fy,
      month: Number(month),
      userId,
      res,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to download invoices",
      error: error.message,
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.userId;
    const invoice = await getInvoicesByIdService(id, userId);

    const filePath = path.join(process.cwd(), "src", "public", invoice.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader("Content-Disposition", "inline");
    res.sendFile(filePath);
    res.setHeader("Content-Type", "application/pdf");

  } catch (error) {
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};
