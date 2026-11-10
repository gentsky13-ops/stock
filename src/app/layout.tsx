import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Link from "next/link";
import { Suspense } from "react";
import { SITE } from "@/lib/config";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { StoreProvider } from "@/components/store";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s — ${SITE.name}` },
  description: SITE.intro,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <Suspense>
            <Header user={user} admin={isAdmin(user)} />
          </Suspense>
          <main className="flex-1">{children}</main>
          <CartDrawer />
          <footer className="mt-24 border-t border-line">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-10 text-[13px] text-ink-2 md:flex-row md:items-center md:justify-between md:px-8">
              <p className="label">
                {SITE.name} · {new Date().getFullYear()}
              </p>
              <div className="flex flex-wrap gap-5">
                <Link href="/licenses" className="hover:text-ink">
                  Licenses
                </Link>
                <Link href="/account" className="hover:text-ink">
                  Your library
                </Link>
                <a href={`mailto:${SITE.supportEmail}`} className="hover:text-ink">
                  Support
                </a>
              </div>
            </div>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
