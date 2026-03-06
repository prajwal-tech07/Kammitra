const express = require("express");
const Job = require("../models/Job");
const Application = require("../models/Application");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/jobs?category=&payType=&search=
router.get("/", async (req, res) => {
  try {
    const { category, payType, search } = req.query;
    const filter = { status: "open" };

    if (category) {
      filter.category = category;
    }
    if (payType) {
      filter.payType = payType;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
      ];
    }

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ jobs });
  } catch (err) {
    console.error("GET /api/jobs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/jobs/:jobId/apply — worker applies to a job
router.post("/:jobId/apply", auth, async (req, res) => {
  try {
    // Only workers can apply
    if (req.user.role !== "worker") {
      return res.status(403).json({ error: "Only workers can apply to jobs" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    if (job.status !== "open") {
      return res.status(400).json({ error: "This job is no longer open" });
    }

    // Check if already applied
    const existing = await Application.findOne({
      jobId: req.params.jobId,
      workerId: req.user.userId,
    });
    if (existing) {
      return res.status(409).json({ error: "You have already applied to this job" });
    }

    const application = await Application.create({
      jobId: req.params.jobId,
      workerId: req.user.userId,
    });

    return res.status(201).json({ application });
  } catch (err) {
    console.error("POST /api/jobs/:jobId/apply error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
