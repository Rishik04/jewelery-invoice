import { logger } from "../utils/logger.js";
import ProductModel from "../model/product.model.js";
import CompanyModel from "../model/companyModel.js";

export const createProductInDB = async (product) => {
  logger.info("Create product with data " + product);
  const company = await CompanyModel.findOne({ userId: product.userId });
  if (!company) throw new Error("Company not found for userId: " + product.userId);
  const updatedProduct = { ...product, companyId: company._id };
  const productFromDB = await new ProductModel(updatedProduct).save(); // FIX: added `new`
  return productFromDB;
};

//get all products of the company
export const getAllProductsFromDB = async (data) => {
  logger.info("Get all products for tenant id " + data.userId);
  return await ProductModel.find({ userId: data.userId });
};

//get all products by the type
export const getProductsByTypeFromDB = async ({ userId, type }) => {
  logger.info("Get products for category " + type);
  return await ProductModel.find({ userId: userId, category: type });
};


export const updateProductInDB = async ({ productId, userId, ...updateData }) => {
  try {
    const updated = await ProductModel.findOneAndUpdate(
      { _id: productId, userId },   // ✅ ensures user owns product
      { $set: updateData },
      { new: true }                 // ✅ return updated doc
    );

    return updated;
  } catch (err) {
    console.error("DB update error:", err);
    throw err;
  }
};

export const deleteProductFromDB = async ({ productId, userId }) => {
  try {
    const deleted = await ProductModel.findOneAndDelete({
      _id: productId,
      userId,
    });

    return deleted;
  } catch (err) {
    console.error("DB delete error:", err);
    throw err;
  }
};
