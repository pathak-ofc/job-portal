import connectDb from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDb();
        return NextResponse.json({ message: "pong" });
    } catch (error) {
        return NextResponse.json(
            { message: "Database connection failed", error: (error as Error).message },
            { status: 500 }
        );
    }
}