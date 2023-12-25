import mongoose from "mongoose";

const systemDataSchema = new mongoose.Schema({
    title: { type: String, required: true },
    nextSubmissionId: { type: Number, required: true }
})

export default mongoose.models.systemDataSchema || mongoose.model("systemData", systemDataSchema, "systemData")