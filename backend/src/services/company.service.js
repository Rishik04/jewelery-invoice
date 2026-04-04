import CompanyModel from "../model/companyModel.js";
import CustomerModel from "../model/customerModel.js";
import { logger } from "../utils/logger.js";

//create company
export const createCompany = async (data) => {
  logger.info("creating company details with data " + data);
  try {
    const comapany = await new CompanyModel(data).save();
    return comapany;
  } catch (err) {
    console.log(err);
  }
};

export const getCompanyByTenantId = async (userId) => {
  logger.info("Get company details with tenant id " + userId);
  return await CompanyModel.findOne({ userId: userId })
    .populate("address")
    .populate("bank");
};

export const updateCompanyDetails = async (data) => {
  logger.info("updating company details with data" + data);
  const company = await CompanyModel.findOneAndUpdate(
    { userId: data.userId },
    data,
    { new: true },
  )
    .populate("address")
    .populate("bank");
  // await sendCompanyEvent("company.updated", company.toObject());
  return company;
};

//customer services
export const createCustomerData = async (data, companyId, userId) => {
  logger.info("adding customer data" + data);
  const { address, name, phone } = data;
  const custData = {
    customerName: name,
    customerPhone: phone,
    customerAddress: address,
    companyId,
    userId,
  };
  await new CustomerModel(custData).save();
};

export const getCustomerByTenantId = async (userId) => {
  logger.info("Get company details with tenant id " + userId);
  return await CustomerModel.find({ userId: userId }, {userId: 0, companyId: 0});
};
