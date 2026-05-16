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

const buildFallbackHistory = (symbol, points = 30) => {
  const basePrice = getFallbackPrice(symbol);
  const seed = symbol
    .toUpperCase()
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return Array.from({ length: points }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (points - index - 1));

    const wave = Math.sin((index + seed % 7) / 3) * (basePrice * 0.025);
    const drift = ((index - points / 2) / points) * (basePrice * 0.06);
    const close = Number(Math.max(10, basePrice + wave + drift).toFixed(2));

    return {
      date: date.toISOString().split("T")[0],
      close,
    };
  });
};

const buildQuoteUrl = (symbol) =>
  `${ALPHA_VANTAGE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
    symbol
  )}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;

const fetchDailySeries = async (symbol, outputSize = "compact") => {
  if (!hasApiKey) {
    return null;
  }

  const dailyUrl = `${ALPHA_VANTAGE_URL}?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(
    symbol
  )}&outputsize=${encodeURIComponent(outputSize)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
  const response = await fetch(dailyUrl);

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  const series = result?.["Time Series (Daily)"];

  if (!series || typeof series !== "object") {
    return null;
  }

  return Object.entries(series)
    .slice(0, 30)
    .map(([date, values]) => ({
      date,
      close: Number(values?.["4. close"]),
    }))
    .filter((item) => Number.isFinite(item.close))
    .reverse();
};

const getLiveQuote = async (symbol) => {
  const normalizedSymbol = symbol.toUpperCase();
  const validAfter = new Date(Date.now() - STOCK_PRICE_TTL_MS);

  const [freshCache, anyCache] = await Promise.all([
    StockCache.findOne({
      symbol: normalizedSymbol,
      lastUpdated: { $gt: validAfter },
    }),
    StockCache.findOne({ symbol: normalizedSymbol }).sort({ lastUpdated: -1 }),
  ]);

  if (freshCache) {
    return {
      price: freshCache.price,
      source: "cached",
      lastUpdated: freshCache.lastUpdated,
    };
  }

  if (hasApiKey) {
    const url = buildQuoteUrl(normalizedSymbol);
    console.log("[AlphaVantage] Quote URL:", url);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("[AlphaVantage] Quote raw response:", JSON.stringify(result));

      const price = Number(result?.["Global Quote"]?.["05. price"]);

      if (Number.isFinite(price) && price > 0) {
        const updated = await StockCache.findOneAndUpdate(
          { symbol: normalizedSymbol },
          {
            symbol: normalizedSymbol,
            price,
            lastUpdated: new Date(),
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return {
          price,
          source: "live",
          lastUpdated: updated.lastUpdated,
        };
      }

      throw new Error("Price missing in Global Quote response");
    } catch (error) {
      console.error(`[AlphaVantage] Quote error for ${normalizedSymbol}:`, error);
    }
  } else {
    console.log(`[AlphaVantage] API key missing or placeholder for ${normalizedSymbol}`);
  }

  if (anyCache) {
    return {
      price: anyCache.price,
      source: "cached",
      lastUpdated: anyCache.lastUpdated,
    };
  }

  return {
    price: null,
    source: "unavailable",
    lastUpdated: null,
  };
};

const getLivePrice = async (symbol) => {
  const quote = await getLiveQuoteWithHistoryFallback(symbol);

  if (Number.isFinite(quote.price) && quote.price > 0) {
    return quote.price;
  }

  throw new Error("Stock price unavailable");
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
      const normalizedQuery = keywords.trim().toLowerCase();

      return result.bestMatches
        .map((match) => ({
          symbol: match["1. symbol"],
          name: match["2. name"],
          region: match["4. region"],
          currency: match["8. currency"],
          score: Number(match["9. matchScore"] || 0),
        }))
        .filter(
          (match) =>
            typeof match.symbol === "string" &&
            match.symbol.trim() &&
            typeof match.name === "string" &&
            match.name.trim()
        )
        .sort((a, b) => {
          const scoreEntry = (entry) => {
            const symbol = entry.symbol.toLowerCase();
            const name = entry.name.toLowerCase();
            const region = (entry.region || "").toLowerCase();
            const currency = (entry.currency || "").toLowerCase();

            let score = entry.score;

            if (symbol === normalizedQuery) {
              score += 5;
            }

            if (name.includes(normalizedQuery)) {
              score += 2;
            }

            if (symbol.endsWith(".bse") || symbol.endsWith(".nse")) {
              score += 4;
            }

            if (region.includes("india")) {
              score += 3;
            }

            if (currency === "inr") {
              score += 2;
            }

            return score;
          };

          return scoreEntry(b) - scoreEntry(a);
        })
        .slice(0, 5)
        .map(({ symbol, name }) => ({ symbol, name }));
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

const getStockHistory = async (symbol, outputSize = "compact") => {
  const normalizedSymbol = symbol.toUpperCase();
  const liveHistory = await fetchDailySeries(normalizedSymbol, outputSize);

  if (liveHistory?.length) {
    return liveHistory;
  }

  return buildFallbackHistory(normalizedSymbol);
};

const getLatestHistoryClose = async (symbol) => {
  const history = await fetchDailySeries(symbol.toUpperCase(), "compact");

  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  const latestPoint = history[history.length - 1];
  return Number.isFinite(latestPoint?.close) ? latestPoint.close : null;
};

const originalGetLiveQuote = getLiveQuote;

const getLiveQuoteWithHistoryFallback = async (symbol) => {
  const quote = await originalGetLiveQuote(symbol);

  if (Number.isFinite(quote.price) && quote.price > 0) {
    return quote;
  }

  try {
    const latestClose = await getLatestHistoryClose(symbol);

    if (Number.isFinite(latestClose) && latestClose > 0) {
      return {
        price: latestClose,
        source: "fallback",
        lastUpdated: new Date(),
      };
    }
  } catch (error) {
    console.error(`[AlphaVantage] History fallback error for ${symbol.toUpperCase()}:`, error);
  }

  return quote;
};

module.exports = {
  getLiveQuote: getLiveQuoteWithHistoryFallback,
  getLivePrice,
  searchStocks,
  getStockHistory,
};
