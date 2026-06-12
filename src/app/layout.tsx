import type { Metadata } from "next";
import { Poppins, Montserrat, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-poppins" 
});

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat" 
});

const robotoMono = Roboto_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "500", "700"],
  variable: "--font-roboto-mono" 
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
      className={`dark h-full w-full antialiased overflow-hidden ${poppins.variable} ${montserrat.variable} ${robotoMono.variable}`}
    >
      <body className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
