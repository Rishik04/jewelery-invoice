import mongoose from "mongoose";

// Company Schema
const bankSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
    unique: true,
  },
  ifsc: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const BankModel = mongoose.model("Bank", bankSchema);

export default BankModel;
