const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  { status: String, date: { type: Date, default: Date.now } },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    jobType: { type: String, required: true, enum: ["Full-time", "Internship", "Contract"] },
    appliedDate: { type: Date, required: true },
    expectedSalary: { type: Number, min: 0 },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Applied", "Interview", "Offer", "Rejected", "Accepted", "Declined"],
      default: "Applied",
    },
    statusHistory: [historySchema],
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
