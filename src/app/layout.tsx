import type { Metadata } from "next";
import { Lato, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Header } from "@/components/header";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "block",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "block",
});

export const metadata: Metadata = {
  title: "Baseball Queue — Fantasy Baseball Drafts",
  description: "Fantasy baseball draft and league management",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${lato.variable} ${geistMono.variable} min-h-screen bg-zinc-50 antialiased dark:bg-zinc-950`}
        >
          <Header />
          <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
