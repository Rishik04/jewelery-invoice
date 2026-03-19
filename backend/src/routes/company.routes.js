import express from "express";
import { auth } from "../auth/auth.js";
import { createAddress, updateAddress } from "../controllers/addresss.controller.js";
import { createBank, updateBank } from "../controllers/bank.controller.js";
import { addCompany, getCompany, getCompanyById, updateCompany } from "../controllers/company.controller.js";
import { createProduct, getProducts, getProductsByType } from "../controllers/product.controller.js";

const companyRoutes = express.Router();

// Company
companyRoutes.get("/", auth, getCompany);
companyRoutes.post("/add", auth, addCompany);
companyRoutes.put("/update", auth, updateCompany);
// companyRoutes.get("/:id", auth, getCompanyById);   // was commented out

// Address
companyRoutes.post("/create-address", auth, createAddress);
companyRoutes.put("/update-address/:id", auth, updateAddress);

// Bank
companyRoutes.post("/create-bank-details", auth, createBank);
companyRoutes.put("/update-bank-details/:id", auth, updateBank);

// Products
companyRoutes.post("/add-product", auth, createProduct);
companyRoutes.get("/get-products", auth, getProducts);
companyRoutes.get("/get-products/:type", auth, getProductsByType);

export default companyRoutes;
