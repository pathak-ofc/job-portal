import connectDb from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        await connectDb();
        return NextResponse.json({ message: "pong" });
    } catch (error) {
        // don't leak internal error details (e.g. connection string/host) to callers
        console.error(error);
        return NextResponse.json(
            { message: "Database connection failed" },
            { status: 500 }
        );
    }
}
