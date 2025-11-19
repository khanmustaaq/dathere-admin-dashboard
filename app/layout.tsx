import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "datHere Admin Dashboard",
  description: "Data portal administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark">
      <body className="h-full bg-white dark:bg-[#0f1729]">
        {children}
      </body>
    </html>
  );
}
