import mongoose from "mongoose";

const judgerNodeSchema = new mongoose.Schema({
   title: { type: String, required: true },
   input: { type: String, required: true },
   output: { type: String, required: true },
   driverHead: { type: String, required: true },
   driverMain: { type: String, required: true },
   timeLimit_sec: { type: String, required: true },
   memoryLimit_kb: { type: String, required: true },
})

export default mongoose.models.JudgerNode || mongoose.model("JudgerNode", judgerNodeSchema, "JudgerNode")