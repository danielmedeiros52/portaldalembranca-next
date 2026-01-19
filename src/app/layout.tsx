import "~/styles/globals.css";

import { type Metadata } from "next";
import Script from "next/script";
import { Geist } from "next/font/google";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/theme-provider";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: {
    default: "Portal da Lembrança - Memoriais Digitais com QR Code",
    template: "%s | Portal da Lembrança",
  },
  description: "Preserve memórias com tecnologia e sensibilidade. Crie memoriais digitais duradouros com QR codes personalizados. Solução desenvolvida em Pernambuco para famílias e funerárias.",
  keywords: ["memorial digital", "qr code", "homenagem", "lembrança", "funerária", "cemitério", "Pernambuco", "Recife"],
  authors: [{ name: "Portal da Lembrança" }],
  creator: "Portal da Lembrança",
  publisher: "Portal da Lembrança",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://portaldalembranca.com.br"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Portal da Lembrança",
    title: "Portal da Lembrança - Memoriais Digitais com QR Code",
    description: "Preserve memórias com tecnologia e sensibilidade. Crie memoriais digitais duradouros.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal da Lembrança",
    description: "Preserve memórias com tecnologia e sensibilidade",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LTWQ79X7XJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LTWQ79X7XJ');
          `}
        </Script>

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>
            {children}
            <Toaster />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
