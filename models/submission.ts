import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
   submissionId: { type: Number, required: true, unique: true },
   user: { type: String, required: true },
   problemId: { type: Number, required: true },
   code: { type: String, required: true },
   status: { type: String, required: true },
   time: { type: Date, required: true }
});

export default mongoose.models.Submission || mongoose.model("Submissions", submissionSchema, "Submissions");