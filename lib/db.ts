import mongoose from "mongoose";

const MONGODB_URL = (process.env.MONGODB_URL || process.env.MONGODB_URI || "") as string;

if (!MONGODB_URL) {
  throw new Error("Missing MONGODB_URL (or MONGODB_URI) environment variable");
}

if (!process.env.AUTH_SECRET) {
  // AUTH_SECRET signs/encrypts session JWTs — without it, next-auth falls
  // back to an insecure default in some environments. Fail loudly instead.
  throw new Error(
    "Missing AUTH_SECRET environment variable — required to sign session tokens securely"
  );
}
if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
  throw new Error("AUTH_SECRET must be at least 32 characters long for security");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDb = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URL)
      .then((m) => m.connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

export default connectDb;
