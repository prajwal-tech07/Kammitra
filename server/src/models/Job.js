const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Cleaning",
        "Shop Work",
        "Construction",
        "Plumbing",
        "Electrical",
        "Driving",
        "Cooking",
        "Babysitting",
      ],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    payAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    payType: {
      type: String,
      required: true,
      enum: ["per_day", "per_month"],
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "filled"],
      default: "open",
    },
    filledAt: {
      type: Date,
      default: null,
    },
    rated: {
      type: Boolean,
      default: false,
    },
    ratedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
