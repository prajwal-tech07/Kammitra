const mongoose = require("mongoose");

const workerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      default: [],
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
    availability: {
      type: String,
      enum: ["Morning", "Evening", "Full Day"],
      default: "Full Day",
    },
    location: {
      type: String,
      default: "",
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    goodRatings: {
      type: Number,
      default: 0,
    },
    badRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkerProfile", workerProfileSchema);
