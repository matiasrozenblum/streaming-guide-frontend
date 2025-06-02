import axios from "axios";
import { signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Forzar logout y redirigir al home
      signOut({ callbackUrl: '/' });
    }
    return Promise.reject(error);
  }
);