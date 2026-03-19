import mongoose from "mongoose";

const companyCacheSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: [String],
    gstin: String,
    hallMarkNumber: String,
    address: Object,
    bank: Object,
    termsConditions: [String],
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const CompanyCacheModel = mongoose.model("CompanyCache", companyCacheSchema);

export default CompanyCacheModel;
