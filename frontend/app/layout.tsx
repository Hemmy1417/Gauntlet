import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { Backdrop } from "@/components/Backdrop";
import { NetworkBanner } from "@/components/NetworkBanner";
import { CONTRACT_ADDRESS, explorerAddressUrl } from "@/lib/config";

const display = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const sans = Sora({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Gauntlet — adversarial honeypot arena for Intelligent Contracts",
  description:
    "Plant an AI-adjudicated honeypot, lock a bounty, and pay anyone who can make the panel rule wrong. Prompt-injection attacks, adjudicated by a deterministic referee, recorded on-chain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Backdrop />
          <NetworkBanner />
          <Nav />
          <main className="flex-1">{children}</main>
          <footer style={{ borderTop: "1px solid var(--line)" }}>
            <div className="mx-auto max-w-6xl px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
              <span className="mono">Every attack — held or breach — is a public GenLayer record.</span>
              <Link href={explorerAddressUrl(CONTRACT_ADDRESS)} target="_blank"
                className="font-semibold hover:underline mono" style={{ color: "var(--breach)" }}>
                Contract on explorer ↗
              </Link>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
