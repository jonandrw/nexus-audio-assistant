import type { Metadata } from "next";
import { Montserrat, Poppins, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MixVision Pro",
  description: "Asistente Inteligente de Mezcla FOH en Tiempo Real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${montserrat.variable} ${robotoMono.variable} dark h-full w-full antialiased overflow-hidden`}
    >
      <body className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
