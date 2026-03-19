import mongoose from "mongoose";

// Company Schema
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
  },
  state: {
    type: String,
    required: true,
  },
  statecode: {
    type: String,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AddressModel = mongoose.model("Address", addressSchema);

export default AddressModel;
