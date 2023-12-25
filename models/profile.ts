import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    pass: {type: String, required: true},
    sessionKey: { type: String }
})

export default mongoose.models.Profiles || mongoose.model("Profiles", profileSchema, "Profiles")