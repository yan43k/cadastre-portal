import { SITE_URL } from "../config";
import { SPECIALIST } from "../content/specialist";

export function JsonLdLocalBusiness() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SPECIALIST.fullName,
    description:
      "Кадастровый инженер. Межевание, технические планы, кадастровый учёт. Павловский район, Алтайский край.",
    address: {
      "@type": "PostalAddress",
      addressRegion: "Алтайский край",
      addressLocality: "с. Павловск, Павловский район",
      streetAddress: "ул. Пионерская, д. 20г",
      addressCountry: "RU",
    },
    telephone: "+79039905136",
    email: SPECIALIST.email,
    areaServed: "Алтайский край",
    url: SITE_URL,
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
