import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata = {
  title: "LoginBook",
  description: "Audit-focused digital logbook"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
