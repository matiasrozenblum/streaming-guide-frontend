import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "La Guía del Streaming",
  description: "Guía de programación de streaming",
};

export default function MobileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
} 