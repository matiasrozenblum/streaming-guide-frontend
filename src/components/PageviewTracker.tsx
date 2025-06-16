"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageview } from "@/lib/gtag";

export default function PageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      pageview(pathname);
    }
  }, [pathname]);

  return null;
} 