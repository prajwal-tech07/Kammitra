const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema(
  {
    name_hi: {
      type: String,
      required: true,
      trim: true,
    },
    name_en: {
      type: String,
      required: true,
      trim: true,
    },
    short_desc: {
      type: String,
      required: true,
      trim: true,
    },
    eligibility: {
      type: [String],
      default: [],
    },
    docs_needed: {
      type: [String],
      default: [],
    },
    apply_link: {
      type: String,
      default: "",
      trim: true,
    },
    who_for: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast filtering by status and who_for
schemeSchema.index({ status: 1 });
schemeSchema.index({ who_for: 1 });

module.exports = mongoose.model("Scheme", schemeSchema);
