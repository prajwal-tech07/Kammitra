const mongoose = require("mongoose");

const schemeApplicationSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scheme",
      required: true,
    },
    referenceNo: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["applied", "approved", "rejected"],
      default: "applied",
    },
  },
  { timestamps: true }
);

// One worker can apply to a scheme only once
schemeApplicationSchema.index({ workerId: 1, schemeId: 1 }, { unique: true });

module.exports = mongoose.model("SchemeApplication", schemeApplicationSchema);
