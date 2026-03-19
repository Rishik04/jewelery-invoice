import { errorResponse, successResponse } from "../response/response.js";
import {
    createProductInDB,
    getAllProductsFromDB,
    getProductsByTypeFromDB,
} from "../services/product.service.js";
import { logger } from "../utils/logger.js";

export const createProduct = async (req, res) => {
  logger.info("create product with user id");
  try {
    const data = { ...req.body, userId: req.user.userId };
    const response = await createProductInDB(data);
    if (response) {
      return successResponse(res, 200, "added product", response);
    } else {
      return errorResponse(res, 400, "unable to add product", {});
    }
  } catch (err) {
    console.log(err);
  }
};

export const getProducts = async (req, res) => {
  logger.info("Get all products for userId" + req.user.userId);
  try {
    const data = { ...req.body, userId: req.user.userId };
    const response = await getAllProductsFromDB(data);
    if (response) {
      return successResponse(res, 200, "fetched product", response);
    } else {
      return errorResponse(res, 400, "unable to fetch product", {});
    }
  } catch (err) {
    console.log(err);
  }
};

export const getProductsByType = async (req, res) => {
  logger.info("Get product with type");
  try {
    const { type } = req.params;
    const data = { userId: req.user.userId, type: type.toUpperCase() };
    const response = await getProductsByTypeFromDB(data);
    if (response) {
      return successResponse(res, 200, "fetched product", response);
    } else {
      return errorResponse(res, 400, "unable to fetch product", {});
    }
  } catch (err) {
    console.log(err);
  }
};
