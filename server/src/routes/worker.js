const express = require("express");
const WorkerProfile = require("../models/WorkerProfile");
const Application = require("../models/Application");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /api/worker/profile  — create or update
router.post("/profile", auth, async (req, res) => {
  try {
    const { skills, availability, location } = req.body;

    // ── Validate ────────────────────────────────────────────
    const validSkills = [
      "Cleaning",
      "Shop Work",
      "Construction",
      "Plumbing",
      "Electrical",
      "Driving",
      "Cooking",
      "Babysitting",
    ];
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: "Select at least one skill" });
    }
    if (skills.some((s) => !validSkills.includes(s))) {
      return res.status(400).json({ error: "Invalid skill value" });
    }
    if (!["Morning", "Evening", "Full Day"].includes(availability)) {
      return res.status(400).json({ error: "Invalid availability" });
    }
    if (!location || location.trim().length < 2) {
      return res.status(400).json({ error: "Location is required" });
    }

    // ── Upsert ──────────────────────────────────────────────
    const profile = await WorkerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { skills, availability, location: location.trim() },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({ profile });
  } catch (err) {
    console.error("worker/profile error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/worker/profile  — fetch current user's profile
router.get("/profile", auth, async (req, res) => {
  try {
    const profile = await WorkerProfile.findOne({ userId: req.user.userId });
    return res.status(200).json({ profile }); // null if not created yet
  } catch (err) {
    console.error("worker/profile GET error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/worker/full-profile — user info + profile + application stats
router.get("/full-profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const profile = await WorkerProfile.findOne({
      userId: req.user.userId,
    }).lean();
    const totalApplications = await Application.countDocuments({
      workerId: req.user.userId,
    });

    return res.status(200).json({
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      profile: profile || null,
      totalApplications,
    });
  } catch (err) {
    console.error("worker/full-profile GET error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/worker/applications — list worker's job applications
router.get("/applications", auth, async (req, res) => {
  try {
    const applications = await Application.find({ workerId: req.user.userId })
      .populate("jobId")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ applications });
  } catch (err) {
    console.error("worker/applications GET error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/worker/applied-ids — list only the job IDs worker has applied to
router.get("/applied-ids", auth, async (req, res) => {
  try {
    const apps = await Application.find(
      { workerId: req.user.userId },
      { jobId: 1, _id: 0 }
    ).lean();

    const ids = apps.map((a) => a.jobId.toString());
    return res.status(200).json({ appliedJobIds: ids });
  } catch (err) {
    console.error("worker/applied-ids GET error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
