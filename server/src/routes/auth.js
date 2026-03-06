const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const WorkerProfile = require("../models/WorkerProfile");

const router = express.Router();

// POST /api/auth/phone-login
router.post("/phone-login", async (req, res) => {
  try {
    const { phone, role } = req.body;

    // ── Validate ────────────────────────────────────────────
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone must be exactly 10 digits" });
    }
    if (!role || !["worker", "employer"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'worker' or 'employer'" });
    }

    // ── Find or create user ─────────────────────────────────
    let user = await User.findOne({ phone });

    if (user) {
      // Update role if the same phone logs in with a different role
      if (user.role !== role) {
        user.role = role;
        await user.save();
      }
    } else {
      user = await User.create({ phone, role });
    }

    // ── Generate a simple JWT ───────────────────────────────
    const token = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ── Check if worker has completed profile ────────────────
    let profileComplete = false;
    if (user.role === "worker") {
      const wp = await WorkerProfile.findOne({ userId: user._id });
      profileComplete = !!(wp && wp.skills.length > 0);
    } else {
      profileComplete = true; // employers don't need onboarding yet
    }

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        role: user.role,
        name: user.name,
        profileComplete,
      },
    });
  } catch (err) {
    console.error("phone-login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/auth/update-name
router.patch("/update-name", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.name = req.body.name || "";
    await user.save();
    return res.status(200).json({ name: user.name });
  } catch (err) {
    console.error("update-name error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
