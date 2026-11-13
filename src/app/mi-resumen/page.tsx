import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecapClient } from "@/components/wrapped/RecapClient";
import { RecapSignedOut } from "@/components/wrapped/RecapSignedOut";

export const metadata: Metadata = {
  title: "Mi resumen | La Guía del Streaming",
  description: "Lo que más viste en la semana, el mes o el año.",
};

export default async function MiResumenPage() {
  /**
   * A visitor used to be bounced to the grid, which hid the feature most worth
   * signing up for from exactly the people who have not signed up. They get the
   * pitch and the form instead; the recap itself still needs an account,
   * because it is made of their own history.
   */
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <RecapSignedOut />;
  }

  return <RecapClient />;
}
