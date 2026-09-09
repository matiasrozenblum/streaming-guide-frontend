import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { RecapClient } from "@/components/wrapped/RecapClient";

export const metadata: Metadata = {
  title: "Mi resumen | La Guía del Streaming",
  description: "Lo que más viste en la semana, el mes o el año.",
};

export default async function MiResumenPage() {
  // Same gate as /subscriptions: this page is only about the signed-in user, so
  // there is nothing to render for a visitor.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/");
  }

  return <RecapClient />;
}
