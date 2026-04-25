const AILog = require("../models/AILog");

const createAILog = async (req, res) => {
  try {
    const log = await AILog.create({
      userId: req.body.userId,
      agentType: req.body.agentType,
      inputSummary: req.body.inputSummary,
      outputSummary: req.body.outputSummary,
      actionTaken: req.body.actionTaken,
    });

    return res.status(201).json(log);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAILog,
};
