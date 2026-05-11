import { cookies } from "next/headers";
import { translations, type Locale, type TranslationKey } from "./translations";

export async function getServerT() {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value ?? "en") as Locale;
  return function t(key: TranslationKey): string {
    return translations[locale]?.[key] ?? translations.en[key];
  };
}
