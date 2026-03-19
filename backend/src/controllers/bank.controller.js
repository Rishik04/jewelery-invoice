import { errorResponse, successResponse } from "../response/response.js";
import { createBankInDB, updateBankInDB } from "../services/bank.service.js";
import { logger } from "../utils/logger.js";

//create bank details
export const createBank = async (req, res) => {
  logger.info("create bank with tenant id");
  try {
    const data = { ...req.body, tenantId: req.user.tenantId };
    const response = await createBankInDB(data);
    if (response) {
      return successResponse(res, 200, "added bank", response);
    } else {
      return errorResponse(res, 400, "unable to add bank", {});
    }
  } catch (err) {
    console.log(err);
  }
};

//update bank details
export const updateBank = async (req, res) => {
  logger.info("update bank details with id " + req.params.id);
  try {
    const id = req.params.id;
    const data = req.body;
    const bank = await updateBankInDB(id, data);
    if (bank) {
      return successResponse(res, 200, "updated bank", bank);
    } else {
      return errorResponse(res, 400, "unable to update bank", {});
    }
  } catch (err) {
    console.log(err);
  }
};
