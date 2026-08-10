import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import CompanyProfile from "@/models/CompanyProfile";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const { allowed } = rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
        if (!allowed) {
            return NextResponse.json(
                { message: "Too many registration attempts. Please try again later." },
                { status: 429 }
            );
        }

        await connectDb();
        const body = await req.json();
        const { name, email, password, role } = body;

        // basic manual validation (your zod substitute)
        if (!name || !email || !password || !role) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const trimmedName = String(name).trim();
        if (trimmedName.length < 2 || trimmedName.length > 100) {
            return NextResponse.json(
                { message: "Name must be between 2 and 100 characters" },
                { status: 400 }
            );
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            );
        }

        if (!["student", "company"].includes(role)) {
            return NextResponse.json(
                { message: "Role must be 'student' or 'company'" },
                { status: 400 }
            );
        }

        if (typeof password !== "string" || password.length < 6 || password.length > 200) {
            return NextResponse.json(
                { message: "Password must be between 6 and 200 characters" },
                { status: 400 }
            );
        }

        // check for existing user
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return NextResponse.json(
                { message: "Email is already registered" },
                { status: 409 }
            );
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // create user
        const user = await User.create({
            name: trimmedName,
            email: normalizedEmail,
            password: hashedPassword,
            role,
        });

        // create matching profile based on role
        if (role === "student") {
            await StudentProfile.create({ userId: user._id });
        } else if (role === "company") {
            await CompanyProfile.create({
                userId: user._id,
                companyName: trimmedName, // placeholder, they can edit later
            });
        }

        // never send the password back, even hashed
        const userObject = user.toObject();
        delete userObject.password;

        return NextResponse.json(
            { message: "User registered successfully", user: userObject },
            { status: 201 }
        );
    } catch (error: unknown) {
        // duplicate key race (two concurrent registrations with the same email)
        if ((error as { code?: number }).code === 11000) {
            return NextResponse.json(
                { message: "Email is already registered" },
                { status: 409 }
            );
        }
        console.error(error);
        return NextResponse.json(
            { message: "Registration failed" },
            { status: 500 }
        );
    }
}