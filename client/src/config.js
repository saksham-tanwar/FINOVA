export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const AI_BASE_URL =
  import.meta.env.VITE_AI_BASE_URL || "http://localhost:8000/ai";
