import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstraCast AI — Space Weather Prediction Platform",
  description: "Enterprise AI platform for predicting space weather events including radiation storms, electron flux, solar wind, and IMF Bz using advanced LSTM neural networks.",
  keywords: "space weather, solar storm prediction, electron flux, IMF Bz, solar wind, AI forecasting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
