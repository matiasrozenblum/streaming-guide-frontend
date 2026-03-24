"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSessionContext } from "@/contexts/SessionContext";
import { pageview } from "@/lib/gtag";
import type { SessionWithToken } from "@/types/session";

export default function PageviewTracker() {
  const pathname = usePathname();
  const { session } = useSessionContext();
  const isAdmin = (session as SessionWithToken | null)?.user?.role === 'admin';

  useEffect(() => {
    // Don't track admin users to avoid polluting metrics
    if (typeof window !== "undefined" && !isAdmin) {
      pageview(pathname);
    }
  }, [pathname, isAdmin]);

  return null;
} 