import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { EdgeStoreProvider } from '../app/lib/edgestore';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sharkbucks",
  description: "Everyone is a shark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
      <body className={inter.className}>
      <Navbar />
      <EdgeStoreProvider>{children}</EdgeStoreProvider>
      </body>
    </html>
  );
}
