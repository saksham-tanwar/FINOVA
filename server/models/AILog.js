const mongoose = require("mongoose");

const AILogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  agentType: {
    type: String,
    enum: ["email", "chatbot", "document", "recommendation"],
  },
  inputSummary: {
    type: String,
  },
  outputSummary: {
    type: String,
  },
  actionTaken: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.AILog || mongoose.model("AILog", AILogSchema);
