import { NextResponse, type NextRequest } from "next/server";
import { berandaUntuk, putuskanAkses } from "@/lib/akses";
import { SESSION_COOKIE, readSecret, verifySession } from "@/lib/session";

/** Penjagaan pertama: tolak yang belum masuk atau salah peran sebelum halaman dirender. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sesi = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, readSecret());
  const keputusan = putuskanAkses(pathname, sesi?.peran ?? null);

  if (keputusan.aksi === "ke-masuk") {
    return NextResponse.redirect(new URL("/masuk", request.url));
  }
  if (keputusan.aksi === "ke-beranda") {
    return NextResponse.redirect(new URL(berandaUntuk(keputusan.peran), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/pendamping/:path*"],
};
