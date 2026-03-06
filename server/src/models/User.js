const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Phone must be exactly 10 digits"],
    },
    role: {
      type: String,
      required: true,
      enum: ["worker", "employer"],
    },
    name: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
