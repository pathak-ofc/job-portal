import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import CompanyProfile from "@/models/CompanyProfile";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
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

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "Email is already registered" },
                { status: 409 }
            );
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
        });

        // create matching profile based on role
        if (role === "student") {
            await StudentProfile.create({ userId: user._id });
        } else if (role === "company") {
            await CompanyProfile.create({
                userId: user._id,
                companyName: name, // placeholder, they can edit later
            });
        }

        // never send the password back, even hashed
        const { password: _, ...userWithoutPassword } = user.toObject();

        return NextResponse.json(
            { message: "User registered successfully", user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Registration failed", error: (error as Error).message },
            { status: 500 }
        );
    }
}