import type { Metadata } from "next";
import { generalsans } from "./ui/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGCI",
  description: "Sistema de Gestion de Calificaciones e Informacion Academica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${generalsans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
