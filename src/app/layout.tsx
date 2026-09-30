import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devlog",
  description: "개발자를 위한 기술 블로그 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
