import BankModel from "../model/bankModel.js";
import CompanyModel from "../model/companyModel.js";
import { logger } from "../utils/logger.js";

// Upsert bank by accountNumber — prevents E11000 on re-registration or retry
export const createBankInDB = async (data) => {
  logger.info("upserting bank with accountNumber " + data.accountNumber);
  try {
    const bank = await BankModel.findOneAndUpdate(
      { accountNumber: data.accountNumber },
      { $set: { bankName: data.bankName, branch: data.branch, ifsc: data.ifsc } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return bank;
  } catch (err) {
    logger.error("createBankInDB error: " + err.message);
    throw err;
  }
};

export const updateBankInDB = async (data) => {
  logger.info("updating bank details with id " + data.toString());
  const bank = await BankModel.findByIdAndUpdate(data._id, data, { new: true });
  return bank;
};