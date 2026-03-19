import mongoose from "mongoose";

const HSN_MAPPING = {
  GOLD: "7113",
  SILVER: "7113",
  PLATINUM: "7113",
  DIAMOND: "7102",
};

// Company Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["GOLD", "SILVER", "DIAMOND", "PLATINUM"],
    required: true,
  },
  karat: {
    type: String,
    enum: ["14K", "18K", "22K", "24K"],
    required: function () {
      return this.category === "GOLD";
    },
  },
  hsnNumber: {
    type: String,
    required: false, // auto-set by hook
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔹 Pre-save hook for HSN auto-set
productSchema.pre("save", function (next) {
  if (!this.hsnNumber && this.category) {
    this.hsnNumber = HSN_MAPPING[this.category];
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
