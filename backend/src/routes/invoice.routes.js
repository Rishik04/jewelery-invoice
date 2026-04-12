import express from "express";
import { auth } from "../auth/auth.js";
import { cancelInvoice, downloadInvoices, generateInvoice, getInvoiceById, getInvoices } from "../controllers/invoice.controller.js";

const invoiceRoutes = express.Router();

invoiceRoutes.get("/", (req, res) => {
  res.send("PDF Service running");
});

invoiceRoutes.post("/save-invoice", auth, generateInvoice);
invoiceRoutes.get("/list", auth, getInvoices);
invoiceRoutes.put("/:id/cancel", auth, cancelInvoice)
invoiceRoutes.get("/download", auth, downloadInvoices)
invoiceRoutes.get("/:id/view", auth, getInvoiceById)

export default invoiceRoutes;
