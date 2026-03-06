/**
 * Seed script — run once to populate government schemes:
 *   node src/seed/seedSchemes.js
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const Scheme = require("../models/Scheme");

const SCHEMES = [
  // ══════════════════════════════════════════════════════════
  // CONSTRUCTION-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "निर्माण श्रमिक कल्याण बोर्ड",
    name_en: "BOCW — Construction Worker Welfare Board",
    short_desc: "Registration gives access to ₹3,000 medical aid, ₹50,000 daughter marriage grant, ₹10,000 tool kit, pension & more",
    eligibility: ["Construction worker (mason, painter, carpenter, etc.)", "Worked 90+ days in construction in past year", "18-60 years"],
    docs_needed: ["Aadhaar Card", "Bank Account", "90-day work certificate from contractor/employer", "2 photos"],
    apply_link: "https://bocw.nic.in",
    who_for: ["Construction"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "निर्माण श्रमिकों के बच्चों की शिक्षा सहायता",
    name_en: "Construction Worker Children Education Scholarship",
    short_desc: "₹5,000-₹25,000/year scholarship for children of registered construction workers from Class 1 to graduation",
    eligibility: ["Registered BOCW member", "Child studying in recognized school/college"],
    docs_needed: ["BOCW Registration", "Child's school ID", "Fee receipt", "Aadhaar of parent & child"],
    apply_link: "https://bocw.nic.in",
    who_for: ["Construction"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // PLUMBING-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "प्लंबर स्किल सर्टिफिकेशन (RPL)",
    name_en: "Plumber RPL Certification — Skill India",
    short_desc: "Free Recognition of Prior Learning (RPL) certification for experienced plumbers — nationally recognized certificate + ₹500 reward",
    eligibility: ["Working plumber with 2+ years experience", "18-45 years", "Indian citizen"],
    docs_needed: ["Aadhaar Card", "Experience proof / self-declaration", "Bank Account"],
    apply_link: "https://skillindia.gov.in",
    who_for: ["Plumbing"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्लंबिंग उन्नत प्रशिक्षण कार्यक्रम",
    name_en: "Advanced Plumbing Training — NSDC",
    short_desc: "Free 2-month advanced course covering water harvesting, solar water heater plumbing & modern fittings — ₹8,000 stipend",
    eligibility: ["Basic plumbing experience", "18-45 years", "Class 8 pass minimum"],
    docs_needed: ["Aadhaar Card", "Education certificate", "Bank Account"],
    apply_link: "https://nsdcindia.org",
    who_for: ["Plumbing"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // ELECTRICAL-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "विद्युत कारीगर लाइसेंस योजना",
    name_en: "Electrical Worker License Scheme (State CEI)",
    short_desc: "Get certified electrical wireman/supervisor license — required for govt contracts & higher pay. Free exam via Skill India",
    eligibility: ["Electrician with ITI/experience", "18+ years", "Has basic electrical knowledge"],
    docs_needed: ["Aadhaar Card", "ITI certificate or work experience proof", "2 photos", "Fee ₹100-500"],
    apply_link: "https://cei.gov.in",
    who_for: ["Electrical"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "सौर ऊर्जा तकनीशियन प्रशिक्षण",
    name_en: "Suryamitra Solar Technician Training",
    short_desc: "Free 600-hour solar panel installation & maintenance training — ₹1,500/month stipend, high-demand skill",
    eligibility: ["ITI/10th pass in electrical/relevant trade", "18-45 years", "Physically fit"],
    docs_needed: ["Aadhaar Card", "Education certificate", "Bank Account", "Medical fitness"],
    apply_link: "https://suryamitra.nise.res.in",
    who_for: ["Electrical"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // DRIVING-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "ड्राइवर प्रशिक्षण — प्रधानमंत्री कौशल विकास",
    name_en: "Driver Training — PMKVY (Free Driving License Program)",
    short_desc: "Free LMV/HMV driving license training under Skill India — 3-month course with ₹8,000 stipend on completing",
    eligibility: ["18+ years (LMV) / 20+ years (HMV)", "Class 8 pass minimum", "Medically fit"],
    docs_needed: ["Aadhaar Card", "Education certificate", "Medical certificate", "Learner license"],
    apply_link: "https://skillindia.gov.in",
    who_for: ["Driving"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "ऑटो/टैक्सी चालक सामाजिक सुरक्षा",
    name_en: "Auto/Taxi Driver Social Security (State Transport Welfare)",
    short_desc: "₹2,000/month pension after 60, ₹1 Lakh accident cover, children's education aid — for registered auto/taxi drivers",
    eligibility: ["Auto-rickshaw or taxi driver", "Valid driving license", "Registered with state transport dept"],
    docs_needed: ["Driving License", "Vehicle registration/permit", "Aadhaar Card", "Bank Account"],
    apply_link: "https://transport.gov.in",
    who_for: ["Driving"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // COOKING-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "FSSAI फूड सेफ्टी ट्रेनिंग — FoSTaC",
    name_en: "FSSAI Food Safety Training (FoSTaC)",
    short_desc: "Free/low-cost food safety certification for cooks — improves job prospects, required by restaurants & caterers",
    eligibility: ["Working in food business", "18+ years", "Basic literacy"],
    docs_needed: ["Aadhaar Card", "Photo", "Employer letter (if employed)"],
    apply_link: "https://fostac.fssai.gov.in",
    who_for: ["Cooking"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "PM मातृत्व वंदना — पोषण सखी",
    name_en: "Poshan Sakhi / Community Cook Training (ICDS)",
    short_desc: "₹2,500/month honorarium as community cook at Anganwadi centers — priority to women with cooking skills",
    eligibility: ["Woman 18-45 years", "Cooking experience", "Lives near Anganwadi center"],
    docs_needed: ["Aadhaar Card", "Bank Account", "Address proof"],
    apply_link: "https://icds-wcd.nic.in",
    who_for: ["Cooking"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // CLEANING-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "स्वच्छता कर्मी सम्मान — सफाई मित्र",
    name_en: "Safai Mitra Suraksha — Sanitation Worker Safety",
    short_desc: "Safety equipment, health checkups, ₹10 Lakh accident insurance for sanitation/cleaning workers. Bans manual scavenging.",
    eligibility: ["Sanitation/cleaning worker", "Working in municipal/private sector", "18+ years"],
    docs_needed: ["Aadhaar Card", "Employer certificate", "Bank Account"],
    apply_link: "https://safaimitra.nic.in",
    who_for: ["Cleaning"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "NAMASTE योजना — सफाई कर्मचारी",
    name_en: "NAMASTE Scheme — Mechanized Sanitation Workers",
    short_desc: "Free safety kit + training + ₹25,000 one-time equipment subsidy for sewer/septic tank workers to transition to mechanized cleaning",
    eligibility: ["Sewer/septic tank cleaning worker", "Identified by municipality", "Willing to undergo training"],
    docs_needed: ["Aadhaar Card", "Municipal ID/work certificate", "Bank Account"],
    apply_link: "https://namaste.gov.in",
    who_for: ["Cleaning"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // SHOP WORK-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "दुकान कर्मचारी ESI लाभ",
    name_en: "ESIC Coverage for Shop Workers",
    short_desc: "Free medical care for shop workers + family at ESI hospitals. Maternity benefit, sickness pay & disablement pension.",
    eligibility: ["Shop/establishment employee", "Monthly wage up to ₹21,000", "Employer has 10+ workers"],
    docs_needed: ["Aadhaar Card", "Employer details (ESIC number)", "Bank Account", "Family member details"],
    apply_link: "https://esic.gov.in",
    who_for: ["Shop Work"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // BABYSITTING-specific schemes
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "आंगनवाड़ी कार्यकर्ता / सहायिका",
    name_en: "Anganwadi Worker/Helper — Childcare Employment",
    short_desc: "₹4,500-₹9,000/month as Anganwadi helper for women with childcare experience. Govt health insurance included.",
    eligibility: ["Woman 18-44 years", "Class 10 pass (worker) / Class 5 pass (helper)", "Childcare/cooking interest"],
    docs_needed: ["Aadhaar Card", "Education certificate", "Address proof", "Caste certificate (if SC/ST/OBC)"],
    apply_link: "https://icds-wcd.nic.in",
    who_for: ["Babysitting", "Cooking"],
    status: "active",
    last_updated: new Date(),
  },

  // ══════════════════════════════════════════════════════════
  // GENERAL schemes (for ALL workers)
  // ══════════════════════════════════════════════════════════
  {
    name_hi: "मनरेगा",
    name_en: "MGNREGA",
    short_desc: "₹300/day guaranteed work for 100 days/year in rural areas — road building, water conservation, land leveling",
    eligibility: ["Rural resident", "18-60 years", "Willing to do unskilled manual work"],
    docs_needed: ["Aadhaar Card", "Bank Account", "Job Card (issued by Gram Panchayat)"],
    apply_link: "https://nrega.nic.in",
    who_for: ["Construction", "Cleaning"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "ई-श्रम कार्ड",
    name_en: "e-Shram Card (Unorganized Worker ID)",
    short_desc: "National ID for unorganized workers + ₹2L accident insurance free — must-have for all daily wage workers",
    eligibility: ["Unorganized sector worker", "16-59 years", "Not EPFO/ESIC member"],
    docs_needed: ["Aadhaar Card", "Mobile number linked to Aadhaar", "Bank Account"],
    apply_link: "https://eshram.gov.in",
    who_for: ["Construction", "Cleaning", "Shop Work", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्रधानमंत्री जीवन ज्योति बीमा योजना",
    name_en: "PMJJBY (PM Jeevan Jyoti Bima Yojana)",
    short_desc: "₹2 Lakh life insurance cover for just ₹436/year — auto-debit from bank",
    eligibility: ["18-50 years", "Bank account holder", "Aadhaar linked to bank"],
    docs_needed: ["Aadhaar Card", "Bank Account", "Nomination form"],
    apply_link: "https://jansuraksha.gov.in",
    who_for: ["Construction", "Cleaning", "Shop Work", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्रधानमंत्री सुरक्षा बीमा योजना",
    name_en: "PMSBY (PM Suraksha Bima Yojana)",
    short_desc: "₹2 Lakh accident insurance cover for just ₹20/year — covers death & disability",
    eligibility: ["18-70 years", "Bank account holder"],
    docs_needed: ["Aadhaar Card", "Bank Account"],
    apply_link: "https://jansuraksha.gov.in",
    who_for: ["Construction", "Cleaning", "Shop Work", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "आयुष्मान भारत (PM-JAY)",
    name_en: "Ayushman Bharat (PM-JAY)",
    short_desc: "₹5 Lakh free health insurance per family/year for hospitalization — 1,900+ treatments covered",
    eligibility: ["SECC-2011 listed family", "No existing health insurance", "Worker/daily wage earner"],
    docs_needed: ["Aadhaar Card", "Ration Card", "Ayushman Card (free at CSC center)"],
    apply_link: "https://pmjay.gov.in",
    who_for: ["Construction", "Cleaning", "Shop Work", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "अटल पेंशन योजना",
    name_en: "APY (Atal Pension Yojana)",
    short_desc: "Guaranteed pension ₹1,000-₹5,000/month after age 60 — starts from just ₹42/month",
    eligibility: ["18-40 years", "Bank account holder", "Not a tax payer"],
    docs_needed: ["Aadhaar Card", "Bank Account", "Mobile number linked to bank"],
    apply_link: "https://jansuraksha.gov.in",
    who_for: ["Construction", "Cleaning", "Shop Work", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्रधानमंत्री जन धन योजना",
    name_en: "PMJDY (PM Jan Dhan Yojana)",
    short_desc: "Zero balance bank account + RuPay card + ₹1 Lakh accident cover + overdraft facility",
    eligibility: ["Any Indian citizen", "No existing bank account needed", "10 years or older"],
    docs_needed: ["Aadhaar Card (or any ID proof)", "Passport-size photo"],
    apply_link: "https://pmjdy.gov.in",
    who_for: ["Construction", "Cleaning", "Shop Work", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "राशन कार्ड (राष्ट्रीय खाद्य सुरक्षा)",
    name_en: "Ration Card (National Food Security Act)",
    short_desc: "Free/subsidized rice ₹3/kg, wheat ₹2/kg, 5kg per person/month for BPL families",
    eligibility: ["BPL family", "Annual income below ₹1 Lakh (varies by state)"],
    docs_needed: ["Aadhaar Card", "Income Certificate", "Address Proof", "Family details"],
    apply_link: "https://nfsa.gov.in",
    who_for: ["Construction", "Cleaning", "Shop Work", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "कौशल भारत (स्किल इंडिया — PMKVY)",
    name_en: "Skill India (PMKVY)",
    short_desc: "Free skill training + certificate + ₹8,000 reward on completion — 200+ trades available",
    eligibility: ["18-45 years", "Indian citizen", "Class 8-12 pass (varies by course)"],
    docs_needed: ["Aadhaar Card", "Education Certificate", "Bank Account"],
    apply_link: "https://skillindia.gov.in",
    who_for: ["Construction", "Plumbing", "Electrical", "Driving", "Cooking", "Cleaning"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्रधानमंत्री मुद्रा योजना",
    name_en: "PMMY (PM Mudra Yojana)",
    short_desc: "Business loans up to ₹10 Lakh without collateral — start your own workshop/business",
    eligibility: ["Any Indian citizen", "Non-farm business plan", "No collateral needed for up to ₹10L"],
    docs_needed: ["Aadhaar Card", "PAN Card", "Business plan", "Bank statement (6 months)", "Photo"],
    apply_link: "https://mudra.org.in",
    who_for: ["Plumbing", "Electrical", "Driving", "Cooking", "Shop Work"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्रधानमंत्री आवास योजना",
    name_en: "PMAY (PM Awas Yojana)",
    short_desc: "Subsidy up to ₹2.67 Lakh for building/buying first home for EWS/LIG families",
    eligibility: ["EWS/LIG family (income < ₹6L/year)", "No pucca house anywhere in India", "Woman co-owner preferred"],
    docs_needed: ["Aadhaar Card", "Income Certificate", "No-property Certificate", "Bank Account"],
    apply_link: "https://pmaymis.gov.in",
    who_for: ["Construction", "Cleaning", "Plumbing", "Electrical", "Driving", "Cooking", "Babysitting", "Shop Work"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्रधानमंत्री उज्ज्वला योजना",
    name_en: "PM Ujjwala Yojana",
    short_desc: "Free LPG gas connection + first refill free for BPL women — safer cooking for families",
    eligibility: ["BPL household", "Woman applicant (18+ years)", "No existing LPG connection"],
    docs_needed: ["Aadhaar Card", "BPL Card / Ration Card", "Bank Account", "Passport Photo"],
    apply_link: "https://pmuy.gov.in",
    who_for: ["Cleaning", "Cooking", "Babysitting", "Construction"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "PM स्वनिधि (स्ट्रीट वेंडर)",
    name_en: "PM SVANidhi (Street Vendor Scheme)",
    short_desc: "₹10,000-₹50,000 working capital loan for street vendors at low interest — digital payment cashback",
    eligibility: ["Street vendor", "Vending certificate or survey ID", "18+ years"],
    docs_needed: ["Aadhaar Card", "Vending Certificate / Letter of Recommendation", "Bank Account", "Photo"],
    apply_link: "https://pmsvanidhi.mohua.gov.in",
    who_for: ["Shop Work", "Cooking"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "दीनदयाल अंत्योदय योजना (NRLM)",
    name_en: "DAY-NRLM (National Rural Livelihood Mission)",
    short_desc: "Self-help group formation + skill training + subsidized credit for rural poor women",
    eligibility: ["Rural poor household", "Women preferred", "BPL family member"],
    docs_needed: ["Aadhaar Card", "BPL Certificate", "Bank Account"],
    apply_link: "https://aajeevika.gov.in",
    who_for: ["Cleaning", "Cooking", "Babysitting", "Shop Work"],
    status: "active",
    last_updated: new Date(),
  },
  {
    name_hi: "प्रधानमंत्री किसान सम्मान निधि",
    name_en: "PM Kisan Samman Nidhi",
    short_desc: "₹6,000/year direct cash transfer to farmers (₹2,000 every 4 months)",
    eligibility: ["Small & marginal farmer", "Owns cultivable land", "Not a govt employee"],
    docs_needed: ["Aadhaar Card", "Bank Account", "Land ownership papers", "Khasra/Khatauni"],
    apply_link: "https://pmkisan.gov.in",
    who_for: ["Construction"],
    status: "active",
    last_updated: new Date(),
  },
];

async function seedSchemes() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ MONGO_URI not set in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Clear existing schemes
    const deleted = await Scheme.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing schemes`);

    // Insert new schemes
    const inserted = await Scheme.insertMany(SCHEMES);
    console.log(`✅ Seeded ${inserted.length} government schemes:`);
    inserted.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name_en} — ${s.short_desc.substring(0, 50)}...`);
    });

    await mongoose.disconnect();
    console.log("\n🎉 Done! Disconnected from MongoDB.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  }
}

seedSchemes();
