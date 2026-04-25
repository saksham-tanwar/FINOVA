const express = require("express");

const { createAILog } = require("../controllers/aiController");
const localhostOnly = require("../middleware/localhostOnly");

const router = express.Router();

router.post("/log", localhostOnly, createAILog);

module.exports = router;
