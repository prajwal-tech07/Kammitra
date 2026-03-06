/**
 * Seed script — run once to populate sample jobs:
 *   node src/seed/seedJobs.js
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const Job = require("../models/Job");
const User = require("../models/User");

const SAMPLE_JOBS = [
  {
    title: "House Deep Cleaning",
    category: "Cleaning",
    description: "Need someone to deep clean a 2BHK apartment. All supplies provided.",
    payAmount: 500,
    payType: "per_day",
    location: "Koramangala 5th Block",
  },
  {
    title: "Shop Helper – Grocery Store",
    category: "Shop Work",
    description: "Assist with stocking shelves, billing, and customer service.",
    payAmount: 8000,
    payType: "per_month",
    location: "Indiranagar 100ft Road",
  },
  {
    title: "Construction Site Labour",
    category: "Construction",
    description: "Building construction — brick work, mixing, carrying materials.",
    payAmount: 600,
    payType: "per_day",
    location: "Whitefield Main Road",
  },
  {
    title: "Fix Bathroom Plumbing",
    category: "Plumbing",
    description: "Leaking taps and drain pipe repair in a residential flat.",
    payAmount: 400,
    payType: "per_day",
    location: "HSR Layout Sector 2",
  },
  {
    title: "Electrical Wiring – New Office",
    category: "Electrical",
    description: "Complete wiring for a small office space — switches, fans, lights.",
    payAmount: 700,
    payType: "per_day",
    location: "JP Nagar 6th Phase",
  },
  {
    title: "Personal Driver – Part Time",
    category: "Driving",
    description: "Drive to office and back, Monday to Friday. Own car provided.",
    payAmount: 10000,
    payType: "per_month",
    location: "Jayanagar 4th Block",
  },
  {
    title: "Cook for PG Meals",
    category: "Cooking",
    description: "Cook breakfast and dinner for 10 residents. Veg + non-veg.",
    payAmount: 12000,
    payType: "per_month",
    location: "BTM Layout 2nd Stage",
  },
  {
    title: "Babysitter Needed – Weekdays",
    category: "Babysitting",
    description: "Take care of a 3-year old child while parents are at work.",
    payAmount: 7000,
    payType: "per_month",
    location: "Marathahalli Bridge",
  },
  {
    title: "Office Cleaning – Daily",
    category: "Cleaning",
    description: "Daily cleaning of a small office — sweeping, mopping, dustbin clearance.",
    payAmount: 300,
    payType: "per_day",
    location: "MG Road",
  },
  {
    title: "Delivery Rider – Local Area",
    category: "Driving",
    description: "Deliver grocery orders within 5 km radius. Bike provided.",
    payAmount: 400,
    payType: "per_day",
    location: "Koramangala 8th Block",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Use the first employer in the DB, or create a dummy one
  let employer = await User.findOne({ role: "employer" });
  if (!employer) {
    employer = await User.create({ phone: "0000000000", role: "employer" });
    console.log("📝 Created dummy employer:", employer.phone);
  }

  // Upsert jobs by title so re-running doesn't duplicate
  for (const job of SAMPLE_JOBS) {
    await Job.findOneAndUpdate(
      { title: job.title },
      { ...job, employerId: employer._id },
      { upsert: true, new: true }
    );
  }

  console.log(`🌱 Seeded ${SAMPLE_JOBS.length} sample jobs`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
