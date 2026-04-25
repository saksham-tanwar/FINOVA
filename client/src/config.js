const isLocalHost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const PROD_API_BASE_URL = "https://finova-server-opsl.onrender.com/api";
const PROD_AI_BASE_URL = "https://finova-ai-service.onrender.com/ai";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (isLocalHost ? "http://localhost:5000/api" : PROD_API_BASE_URL);

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL || (isLocalHost ? "http://localhost:8000/ai" : PROD_AI_BASE_URL);
