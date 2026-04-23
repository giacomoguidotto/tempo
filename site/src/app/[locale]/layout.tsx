import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import "../globals.css";

const BASE_URL = "https://tempo.guidotto.dev";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const titles: Record<Locale, string> = {
    en: "Tempo — Find your rhythm",
    it: "Tempo — Trova il tuo ritmo",
  };

  const descriptions: Record<Locale, string> = {
    en: "A beautiful, ad-free repeating alarm app for Android.",
    it: "Un'app di sveglie ricorrenti per Android, bella e senza pubblicità.",
  };

  const loc = (locale in titles ? locale : "en") as Locale;

  return {
    metadataBase: new URL(BASE_URL),
    title: { default: titles[loc], template: "%s | Tempo" },
    description: descriptions[loc],
    authors: [{ name: "Giacomo Guidotto" }],
    creator: "Giacomo Guidotto",
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}`])
      ),
    },
    openGraph: {
      type: "website",
      locale: locale === "it" ? "it_IT" : "en_US",
      siteName: "Tempo",
      title: titles[loc],
      description: descriptions[loc],
    },
    robots: { index: true, follow: true },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <main className="mx-auto max-w-2xl px-6 py-16">{children}</main>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
