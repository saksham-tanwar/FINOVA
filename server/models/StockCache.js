const mongoose = require("mongoose");

const StockCacheSchema = new mongoose.Schema({
  symbol: {
    type: String,
    unique: true,
    required: true,
  },
  price: {
    type: Number,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

StockCacheSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 900 });

module.exports =
  mongoose.models.StockCache || mongoose.model("StockCache", StockCacheSchema);
