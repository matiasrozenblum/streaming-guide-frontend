import axios from "axios";
import { signOut } from "next-auth/react";

export const api = axios.create({
  baseURL: "/api",
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