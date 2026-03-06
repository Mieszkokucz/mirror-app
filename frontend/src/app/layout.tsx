import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mirror",
  description: "Personal reflection system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
