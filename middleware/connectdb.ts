import mongoose from "mongoose";
require('dotenv').config({ path: ".env.local" })

export default async function connectDB() {
    try {
        if (mongoose.connections[0].readyState) {
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI ?? "");
    } catch (error) {
        console.log("Unable to connect to the database");
        console.log(error);
    }
}