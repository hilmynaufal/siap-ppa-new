import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgresNavigasi } from "@/components/progres-navigasi";
// Font dihosting sendiri lewat paket npm: tanpa panggilan ke Google saat build maupun saat dipakai.
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIAP PPA",
  description: "Sistem informasi akses pelayanan perlindungan perempuan dan anak, Kabupaten Bandung.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ProgresNavigasi />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
