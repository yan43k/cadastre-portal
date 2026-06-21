import { Helmet } from "react-helmet-async";
import { Panel, SectionLabel } from "../components/Ui";
import { SITE_URL } from "../config";

const partners = [
  {
    name: "Росреестр / Федеральная служба государственной регистрации",
    role:
      "Взаимодействие в части подачи документов для кадастрового учёта и регистрации прав в рамках установленных процедур.",
    logo: "/partners/rosreestr.svg",
    logoAlt: "Условный знак Росреестра",
  },
  {
    name: "Юридические компании региона",
    role:
      "Корреспонденция по сделкам, согласованию проектов договоров и сопровождению регистрационных действий.",
    logo: "/partners/legal.svg",
    logoAlt: "Символ юридического партнёрства",
  },
  {
    name: "Оценочные организации",
    role: "Согласование исходных данных для объектов, требующих определения рыночной или иной стоимости.",
    logo: "/partners/appraisal.svg",
    logoAlt: "Символ оценочной организации",
  },
  {
    name: "Строительные и проектные организации",
    role:
      "Получение исполнительной документации, обследования объектов, согласование координатной основы.",
    logo: "/partners/construction.svg",
    logoAlt: "Символ строительной организации",
  },
] as const;

export default function PartnersPage() {
  return (
    <>
      <Helmet>
        <title>Партнёрские направления</title>
        <link rel="canonical" href={`${SITE_URL}/partners`} />
      </Helmet>
      <SectionLabel>Взаимодействие</SectionLabel>
      <h1 className="mt-2 font-display text-4xl text-bistre">Партнёры и контрагенты</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink/80">
        Перечень характеризует профильные направления кооперации. Указание организаций не означает
        формального агентского договора с каждой из них; конкретные проекты согласуются отдельно.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {partners.map((p) => (
          <Panel key={p.name}>
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden border border-line bg-parchment/80 p-1 shadow-seal">
              <img
                src={p.logo}
                alt={p.logoAlt}
                width={64}
                height={64}
                className="h-14 w-14 object-contain"
                loading="lazy"
              />
            </div>
            <p className="mt-4 font-display text-xl text-bistre">{p.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">{p.role}</p>
          </Panel>
        ))}
      </div>
    </>
  );
}
