import mongoose from "mongoose";
import { ROLE } from "./role.js";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(ROLE),
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
