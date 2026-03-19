import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true }, // product name snapshot
  category: { type: String }, // GOLD/SILVER/DIAMOND
  karat: { type: String }, // 18K/22K/etc
  hsnNumber: { type: String }, // snapshot HSN
  weight: { type: Number, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  total: { type: Number, required: true }, // weight * quantity * rate
  makingCharges: { type: Number, required: true },
  otherCharges: {type: Number}
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    filePath: { type: String },
    customer: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" }, // reference
      name: String,
      phone: String,
      email: String,
      address: String,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    items: [invoiceItemSchema],
    subtotal: { type: Number },
    tax: { type: Number },
    totalAmount: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const InvoiceModel = mongoose.model("Invoice", invoiceSchema);
export default InvoiceModel;
