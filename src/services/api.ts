import axios from "axios";
import { getSession, signOut } from "next-auth/react";
import type { SessionWithToken } from "@/types/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const session = await getSession() as SessionWithToken | null;
  if (session?.accessToken) {
    config.headers['Authorization'] = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      signOut({ callbackUrl: '/' });
    }
    return Promise.reject(error);
  }
);