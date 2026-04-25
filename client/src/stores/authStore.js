import { create } from "zustand";

import axiosInstance from "../axiosInstance";

const getInitialUser = () => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};

const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  token: localStorage.getItem("token"),
  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
  fetchMe: async () => {
    const { token, logout } = get();

    if (!token) {
      return;
    }

    try {
      const { data } = await axiosInstance.get("/auth/me");
      localStorage.setItem("user", JSON.stringify(data));
      set({ user: data });
    } catch (error) {
      logout();
    }
  },
}));

export default useAuthStore;
