const express = require("express");
const Job = require("../models/Job");
const Application = require("../models/Application");
const WorkerProfile = require("../models/WorkerProfile");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// ── Ensure employer role ────────────────────────────────────
function employerOnly(req, res, next) {
  if (req.user.role !== "employer") {
    return res.status(403).json({ error: "Only employers can access this" });
  }
  next();
}

// POST /api/employer/jobs — create a new job
router.post("/jobs", auth, employerOnly, async (req, res) => {
  try {
    const { title, category, description, payAmount, payType, location } =
      req.body;

    // ── Validate ────────────────────────────────────────────
    const validCategories = [
      "Cleaning",
      "Shop Work",
      "Construction",
      "Plumbing",
      "Electrical",
      "Driving",
      "Cooking",
      "Babysitting",
    ];

    if (!title || title.trim().length < 2) {
      return res.status(400).json({ error: "Title is required (min 2 chars)" });
    }
    if (!category || !validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (payAmount == null || payAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Pay amount must be a positive number" });
    }
    if (!["per_day", "per_month"].includes(payType)) {
      return res.status(400).json({ error: "Invalid pay type" });
    }
    if (!location || location.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Location is required (min 2 chars)" });
    }

    const job = await Job.create({
      employerId: req.user.userId,
      title: title.trim(),
      category,
      description: description ? description.trim() : "",
      payAmount: Number(payAmount),
      payType,
      location: location.trim(),
    });

    return res.status(201).json({ job });
  } catch (err) {
    console.error("POST /api/employer/jobs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/employer/jobs — list jobs posted by this employer + application counts
router.get("/jobs", auth, employerOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch application counts for all jobs in one query
    const jobIds = jobs.map((j) => j._id);
    const counts = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
    ]);

    // Build a map: jobId → count
    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    // Attach applicationCount to each job
    const jobsWithCounts = jobs.map((j) => ({
      ...j,
      applicationCount: countMap[j._id.toString()] || 0,
    }));

    return res.status(200).json({ jobs: jobsWithCounts });
  } catch (err) {
    console.error("GET /api/employer/jobs error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/employer/jobs/:jobId/applicants — list applicants with worker profile data
router.get("/jobs/:jobId/applicants", auth, employerOnly, async (req, res) => {
  try {
    // Ensure job belongs to this employer
    const job = await Job.findById(req.params.jobId).lean();
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    if (job.employerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not your job" });
    }

    // Fetch applications for this job, populate worker user data
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate("workerId", "phone name")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch worker profiles for all applicants in one query
    const workerIds = applications.map((a) => a.workerId?._id).filter(Boolean);
    const profiles = await WorkerProfile.find({ userId: { $in: workerIds } }).lean();
    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.userId.toString()] = p;
    });

    // Merge profile into each application
    const result = applications.map((app) => {
      const wId = app.workerId?._id?.toString();
      const profile = wId ? profileMap[wId] || null : null;
      return {
        _id: app._id,
        status: app.status,
        createdAt: app.createdAt,
        worker: {
          _id: app.workerId?._id,
          phone: app.workerId?.phone || "",
          name: app.workerId?.name || "",
        },
        profile: profile
          ? {
              skills: profile.skills,
              location: profile.location,
              availability: profile.availability,
              completedJobs: profile.completedJobs,
              goodRatings: profile.goodRatings,
              badRatings: profile.badRatings,
            }
          : null,
      };
    });

    return res.status(200).json({ job, applicants: result });
  } catch (err) {
    console.error("GET /api/employer/jobs/:jobId/applicants error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/employer/jobs/:jobId/fill — mark a job as filled
router.patch("/jobs/:jobId/fill", auth, employerOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    if (job.employerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not your job" });
    }
    if (job.status === "filled") {
      return res.status(400).json({ error: "Job is already marked as filled" });
    }

    job.status = "filled";
    job.filledAt = new Date();
    await job.save();

    return res.status(200).json({ job });
  } catch (err) {
    console.error("PATCH /api/employer/jobs/:jobId/fill error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/employer/jobs/:jobId/rate — rate the accepted worker for a filled job
router.post("/jobs/:jobId/rate", auth, employerOnly, async (req, res) => {
  try {
    const { rating } = req.body; // "good" or "bad"
    if (!["good", "bad"].includes(rating)) {
      return res.status(400).json({ error: "Rating must be 'good' or 'bad'" });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    if (job.employerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not your job" });
    }
    if (job.status !== "filled") {
      return res.status(400).json({ error: "Job must be filled before rating" });
    }
    if (job.rated) {
      return res.status(400).json({ error: "You have already rated this job" });
    }

    // Find the accepted worker for this job
    const acceptedApp = await Application.findOne({
      jobId: job._id,
      status: "accepted",
    });
    if (!acceptedApp) {
      return res
        .status(400)
        .json({ error: "No accepted worker found for this job" });
    }

    // Update worker profile stats
    const update =
      rating === "good"
        ? { $inc: { completedJobs: 1, goodRatings: 1 } }
        : { $inc: { completedJobs: 1, badRatings: 1 } };

    await WorkerProfile.findOneAndUpdate(
      { userId: acceptedApp.workerId },
      update
    );

    // Mark job as rated
    job.rated = true;
    job.ratedWorkerId = acceptedApp.workerId;
    await job.save();

    return res.status(200).json({ message: "Rating saved successfully" });
  } catch (err) {
    console.error("POST /api/employer/jobs/:jobId/rate error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/employer/profile — employer profile info
router.get("/profile", auth, employerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const totalJobs = await Job.countDocuments({ employerId: req.user.userId });
    const openJobs = await Job.countDocuments({
      employerId: req.user.userId,
      status: "open",
    });
    const filledJobs = await Job.countDocuments({
      employerId: req.user.userId,
      status: "filled",
    });
    const totalApplications = await Application.countDocuments({
      jobId: {
        $in: await Job.find({ employerId: req.user.userId }).distinct("_id"),
      },
    });

    return res.status(200).json({
      user: {
        _id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      stats: {
        totalJobs,
        openJobs,
        filledJobs,
        totalApplications,
      },
    });
  } catch (err) {
    console.error("GET /api/employer/profile error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/employer/applications/:id — update application status
router.patch("/applications/:id", auth, employerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Verify this application's job belongs to the current employer
    const job = await Job.findById(application.jobId);
    if (!job || job.employerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({ application });
  } catch (err) {
    console.error("PATCH /api/employer/applications/:id error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
