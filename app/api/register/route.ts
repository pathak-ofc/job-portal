import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/User";
import StudentProfile from "@/models/StudentProfile";
import CompanyProfile from "@/models/CompanyProfile";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { registerSchema, formatZodError } from "@/lib/validation";

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const { allowed } = await rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
        if (!allowed) {
            return NextResponse.json(
                { message: "Too many registration attempts. Please try again later." },
                { status: 429 }
            );
        }

        await connectDb();
        const raw = await req.json();
        const parsed = registerSchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json({ message: formatZodError(parsed.error) }, { status: 400 });
        }
        const { name: trimmedName, email: normalizedEmail, password, role } = parsed.data;

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