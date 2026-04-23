import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyContent />;
}

function PrivacyContent() {
  const t = useTranslations("privacy");

  return (
    <article className="space-y-8">
      <header>
        <h1 className="font-bold font-sans text-3xl text-foreground tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-secondary text-sm">{t("lastUpdated")}</p>
      </header>

      <Section title={t("overview.title")}>
        <p>{t("overview.body")}</p>
      </Section>

      <Section title={t("dataCollection.title")}>
        <p>{t("dataCollection.body")}</p>
      </Section>

      <Section title={t("localStorage.title")}>
        <p>{t("localStorage.body")}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-secondary">
          <li>{t("localStorage.item1")}</li>
          <li>{t("localStorage.item2")}</li>
        </ul>
      </Section>

      <Section title={t("thirdParty.title")}>
        <p>{t("thirdParty.body")}</p>
      </Section>

      <Section title={t("permissions.title")}>
        <p>{t("permissions.body")}</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-secondary">
          <li>{t("permissions.item1")}</li>
          <li>{t("permissions.item2")}</li>
          <li>{t("permissions.item3")}</li>
        </ul>
      </Section>

      <Section title={t("children.title")}>
        <p>{t("children.body")}</p>
      </Section>

      <Section title={t("changes.title")}>
        <p>{t("changes.body")}</p>
      </Section>

      <Section title={t("contact.title")}>
        <p>{t("contact.body")}</p>
      </Section>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-sans font-semibold text-foreground text-lg">
        {title}
      </h2>
      <div className="text-secondary text-sm leading-relaxed">{children}</div>
    </section>
  );
}
