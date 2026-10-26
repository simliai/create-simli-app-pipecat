import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const repro = localFont({
  src: [
    { path: "./fonts/ABCRepro-Regular.woff2", weight: "400" },
    { path: "./fonts/ABCRepro-Bold.woff2", weight: "700" },
  ],
  variable: "--font-repro",
});

const reproMono = localFont({
  src: [
    { path: "./fonts/ABCReproMono-Regular.woff2", weight: "400" },
    { path: "./fonts/ABCReproMono-Bold.woff2", weight: "700" },
  ],
  variable: "--font-repro-mono",
});

export const metadata: Metadata = {
  title: "Simli App",
  description: "create-simli-app (Pipecat)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${repro.variable} ${reproMono.variable}`}>
      <body className="bg-black">{children}</body>
    </html>
  );
}
