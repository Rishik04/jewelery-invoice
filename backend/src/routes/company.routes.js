import express from "express";
import { auth } from "../auth/auth.js";
import { createAddress, updateAddress } from "../controllers/addresss.controller.js";
import { createBank, updateBank } from "../controllers/bank.controller.js";
import { addCompany, getCompany, getCompanyById, getCustomer, updateCompany } from "../controllers/company.controller.js";
import { createProduct, deleteProduct, getProducts, getProductsByType, updateProduct } from "../controllers/product.controller.js";

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
companyRoutes.put("/update-product/:productId", auth, updateProduct);
companyRoutes.delete("/delete/:productId", auth, deleteProduct);

//customer
companyRoutes.get("/customer", auth, getCustomer);

export default companyRoutes;
