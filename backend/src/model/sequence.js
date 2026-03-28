import mongoose from "mongoose";

const sequence = new mongoose.Schema(
  {
    fy: { type: String, required: true },
    seq: { type: Number, default: 0 },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true },
);

sequence.index({ fy: 1, companyId: 1 }, { unique: true });

const Sequence = mongoose.model("Sequence", sequence);

export default Sequence;
