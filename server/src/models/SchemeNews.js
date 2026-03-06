const mongoose = require("mongoose");

const schemeNewsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
    link: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pubDate: {
      type: Date,
      default: Date.now,
    },
    priority: {
      type: String,
      enum: ["high", "low"],
      default: "low",
    },
    source: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Index for sorting by pubDate and deduplication by link
schemeNewsSchema.index({ pubDate: -1 });
schemeNewsSchema.index({ link: 1 }, { unique: true });

module.exports = mongoose.model("SchemeNews", schemeNewsSchema);
