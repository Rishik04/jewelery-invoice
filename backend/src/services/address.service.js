import AddressModel from "../model/addressModel.js";
import CompanyModel from "../model/companyModel.js";
import { logger } from "../utils/logger.js";

// Upsert address by tenantId — a tenant should have only one address document
export const createAddressInDB = async (data) => {
  logger.info("upserting address for tenantId " + data.userId);
  try {
    let address;

    if (data.userId) {
      // If a company already exists for this tenant, reuse/update its linked address
      const existing = await CompanyModel.findOne({ userId: data.userId }).select("address");
      if (existing?.address) {
        address = await AddressModel.findByIdAndUpdate(
          existing.address,
          { $set: { street: data.street, city: data.city, landmark: data.landmark, state: data.state, statecode: data.statecode, pincode: data.pincode } },
          { new: true }
        );
      }
    }

    if (!address) {
      address = await new AddressModel(data).save();
    }
    return address;
  } catch (err) {
    logger.error("createAddressInDB error: " + err.message);
    throw err;
  }
};

export const updateAddressInDB = async (data) => {
  logger.info("updating address with id " + data);
  const address = await AddressModel.findByIdAndUpdate(data._id, data, { new: true });
  return address;
};