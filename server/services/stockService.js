const StockCache = require("../models/StockCache");

const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";
const STOCK_PRICE_TTL_MS = 15 * 60 * 1000;

const hasApiKey =
  process.env.ALPHA_VANTAGE_API_KEY &&
  process.env.ALPHA_VANTAGE_API_KEY !== "replace_with_key";

const getFallbackPrice = (symbol) => {
  const seed = symbol
    .toUpperCase()
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return Number((100 + (seed % 2500) / 10).toFixed(2));
};

const getLivePrice = async (symbol) => {
  const normalizedSymbol = symbol.toUpperCase();
  const validAfter = new Date(Date.now() - STOCK_PRICE_TTL_MS);

  const cached = await StockCache.findOne({
    symbol: normalizedSymbol,
    lastUpdated: { $gt: validAfter },
  });

  if (cached) {
    return cached.price;
  }

  let price;

  if (hasApiKey) {
    const url = `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
      normalizedSymbol
    )}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to fetch stock price");
    }

    const result = await response.json();
    price = Number(result?.["Global Quote"]?.["05. price"]);
  }

  if (!Number.isFinite(price) || price <= 0) {
    price = getFallbackPrice(normalizedSymbol);
  }

  await StockCache.findOneAndUpdate(
    { symbol: normalizedSymbol },
    {
      symbol: normalizedSymbol,
      price,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return price;
};

const searchStocks = async (keywords) => {
  if (!keywords?.trim()) {
    return [];
  }

  if (hasApiKey) {
    const url = `${ALPHA_VANTAGE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
      keywords
    )}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to search stocks");
    }

    const result = await response.json();

    if (Array.isArray(result?.bestMatches) && result.bestMatches.length > 0) {
      return result.bestMatches.slice(0, 5).map((match) => ({
        symbol: match["1. symbol"],
        name: match["2. name"],
      }));
    }
  }

  const mockUniverse = [
    { symbol: "RELIANCE.BSE", name: "Reliance Industries Limited" },
    { symbol: "TCS.BSE", name: "Tata Consultancy Services Limited" },
    { symbol: "INFY.BSE", name: "Infosys Limited" },
    { symbol: "HDFCBANK.BSE", name: "HDFC Bank Limited" },
    { symbol: "ICICIBANK.BSE", name: "ICICI Bank Limited" },
    { symbol: "SBIN.BSE", name: "State Bank of India" },
  ];

  const query = keywords.trim().toLowerCase();

  return mockUniverse
    .filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query)
    )
    .slice(0, 5);
};

module.exports = {
  getLivePrice,
  searchStocks,
};
