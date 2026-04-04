import mongoose from "mongoose";

// Company Schema
const customerSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: false,
  },
  customerPhone: {
    type: String,
    required: false,
  },
  customerAddress: {
    type: String,
    required: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CustomerModel = mongoose.model("Customer", customerSchema);

export default CustomerModel;
