import express from "express";
import { auth } from "../auth/auth.js";
import { generateInvoice, getInvoices } from "../controllers/invoice.controller.js";

const invoiceRoutes = express.Router();

invoiceRoutes.get("/", (req, res) => {
  res.send("PDF Service running");
});

invoiceRoutes.post("/save-invoice", auth, generateInvoice);
invoiceRoutes.get("/list", auth, getInvoices);

export default invoiceRoutes;
