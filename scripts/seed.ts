import dotenv from "dotenv";
dotenv.config();

import connectDb from "../lib/db";
import User from "../models/User";
import StudentProfile from "../models/StudentProfile";
import CompanyProfile from "../models/CompanyProfile";
import Job from "../models/Job";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

async function seed() {
  await connectDb();

  // wipe existing data so re-running this script doesn't create duplicates
  await User.deleteMany({});
  await StudentProfile.deleteMany({});
  await CompanyProfile.deleteMany({});
  await Job.deleteMany({});

  const hashedPassword = await bcrypt.hash("password123", 10);

  // --- student ---
  const student = await User.create({
    name: "Ramesh Shrestha",
    email: "ramesh@example.com",
    password: hashedPassword,
    role: "student",
  });

  await StudentProfile.create({
    userId: student._id,
    phone: "9800000000",
    resumeUrl: "",
    skills: ["JavaScript", "React"],
    bio: "Final year CS student looking for internship.",
  });

  // --- company ---
  const company = await User.create({
    name: "Sujan Karki",
    email: "hr@techcorp.com",
    password: hashedPassword,
    role: "company",
  });

  await CompanyProfile.create({
    userId: company._id,
    companyName: "TechCorp Nepal",
    logoUrl: "",
    website: "https://techcorp.example.com",
    description: "A software company based in Kathmandu.",
    verified: true,
  });

  // --- jobs ---
  await Job.create([
    {
      companyId: company._id,
      title: "Frontend Developer Intern",
      description: "Work on our React-based dashboard product.",
      category: "Software Development",
      location: "Kathmandu",
      salaryRange: "NPR 15,000 - 20,000",
      jobType: "internship",
      deadline: new Date("2026-09-30"),
      status: "approved",
    },
    {
      companyId: company._id,
      title: "Backend Engineer",
      description: "Build and maintain Node.js APIs.",
      category: "Software Development",
      location: "Remote",
      salaryRange: "NPR 60,000 - 80,000",
      jobType: "full-time",
      deadline: new Date("2026-10-15"),
      status: "pending",
    },
    {
      companyId: company._id,
      title: "QA Tester",
      description: "Manual and automated testing of web apps.",
      category: "Quality Assurance",
      location: "Pokhara",
      salaryRange: "NPR 25,000 - 30,000",
      jobType: "part-time",
      deadline: new Date("2026-09-20"),
      status: "approved",
    },
  ]);

  console.log("Seed data inserted successfully.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});