import { errorResponse, successResponse } from "../response/response.js";
import { createAddressInDB, updateAddressInDB } from "../services/address.service.js";
import { logger } from "../utils/logger.js";

export const createAddress = async (req, res) => {
  logger.info("Creating the address for tenant");
  try {
    const data = { ...req.body, tenantId: req.user.tenantId };
    const response = await createAddressInDB(data);
    if (response) {
      return successResponse(res, 200, "added address", response);
    } else {
      return errorResponse(res, 400, "unable to add address", {});
    }
  } catch (err) {
    console.log(err);
  }
};


//update address details
export const updateAddress = async (req, res) => {
  logger.info("update address details with id " + req.params.id);
  try {
    const id = req.params.id;
    const data = req.body;
    const address = await updateAddressInDB(id, data);
    if (address) {
      return successResponse(res, 200, "updated address", address);
    } else {
      return errorResponse(res, 400, "unable to update address", {});
    }
  } catch (err) {
    console.log(err);
  }
};

