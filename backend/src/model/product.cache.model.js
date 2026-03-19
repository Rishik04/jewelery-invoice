import mongoose from "mongoose";

const productCacheSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  category: { type: String },
  karat: { type: String },
  hsnNumber: { type: String },
  type: { type: String },
  updatedAt: { type: Date, default: Date.now },
});

const ProductCacheModel = mongoose.model("ProductCache", productCacheSchema);
export default ProductCacheModel;
