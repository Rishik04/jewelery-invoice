import CompanyModel from "../model/companyModel.js";
import { errorResponse, successResponse } from "../response/response.js";
import { createAddressInDB, updateAddressInDB } from "../services/address.service.js";
import { createBankInDB, updateBankInDB } from "../services/bank.service.js";
import {
  createCompany,
  getCompanyByTenantId,
  updateCompanyDetails,
} from "../services/company.service.js";
import { logger } from "../utils/logger.js";

export const getCompany = async (req, res) => {
  logger.info("Get company by tenant id " + req.user.userId);
  try {
    const company = await getCompanyByTenantId(req.user.userId);
    if (!company) return successResponse(res, 200, "No Company found", []);
    return successResponse(res, 200, "Successfully found company", company);
  } catch (error) {
    logger.error(error);
    return errorResponse(res, 500, "Error fetching company", {});
  }
};

// Add OR update company — idempotent.
// A tenant can only have one company. If one already exists, update it.
export const addCompany = async (req, res) => {
  try {
    const userId = req.user.userId;
    req.body.email = req.user.email;

    const {
      city, state, street, landmark, pincode, statecode,
      bankName, branch, ifsc, accountNumber,
    } = req.body;

    // Check if another tenant already owns this GSTIN / hallmark (not the same tenant)
    const conflict = await CompanyModel.findOne({
      userId: { $ne: userId },
      $or: [
        req.body.gstin ? { gstin: req.body.gstin } : null,
        req.body.hallMarkNumber ? { hallMarkNumber: req.body.hallMarkNumber } : null,
      ].filter(Boolean),
    });
    if (conflict) {
      return errorResponse(res, 409, "GSTIN or Hallmark number already registered by another company", {});
    }

    // Upsert address (no duplicate — reuses existing doc if tenant already has one)
    const addressData = { city, state, street, landmark, pincode, statecode, userId };
    const address = await createAddressInDB(addressData);

    // Upsert bank by accountNumber (no E11000)
    const bankData = { bankName, branch, ifsc, accountNumber, userId };
    const bank = await createBankInDB(bankData);

    // Upsert company by userId — one company per tenant
    const existingCompany = await CompanyModel.findOne({ userId });

    let company;
    if (existingCompany) {
      // Update existing company
      company = await CompanyModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            ...req.body,
            userId,
            address: address._id,
            bank: bank._id,
          },
        },
        { new: true }
      ).populate("address").populate("bank");
    } else {
      const {name, gstin, hallMarkNumber, email, phone, termsConditions} = req.body;
      // Create new company
      const companyDataPayload = {
        name, gstin, hallMarkNumber, email, phone, termsConditions,
        userId,
        address: address._id,
        bank: bank._id,
      };
      company = await createCompany(companyDataPayload);
    }

    return successResponse(res, 200, "Company saved successfully", company);
  } catch (error) {
    logger.error(error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return errorResponse(res, 409, `Duplicate value for ${field}`, {});
    }
    return errorResponse(res, 500, "Error saving company", { message: error.message });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 400, "Invalid ID format", {});
    }
    const company = await CompanyModel.findById(req.params.id)
      .populate("address")
      .populate("bank");
    if (!company) return errorResponse(res, 404, "Company not found", {});
    return successResponse(res, 200, "Found company", company);
  } catch (error) {
    logger.error(error);
    return errorResponse(res, 500, "Error fetching company", {});
  }
};

export const updateCompany = async (req, res) => {
  logger.info("update the company details for tenant " + req.user.userId);
  try {
    const data = { ...req.body, userId: req.user.userId };
    const address = req.body.address;
    await updateAddressInDB(address);
    const bank = req.body.bank;
    await updateBankInDB(bank);
    const company = await updateCompanyDetails(data);
    if (!company) return errorResponse(res, 404, "Company not found", {});
    return successResponse(res, 200, "Successfully updated company", company);
  } catch (error) {
    logger.error(error);
    return errorResponse(res, 500, "Error updating company", { message: error.message });
  }
};