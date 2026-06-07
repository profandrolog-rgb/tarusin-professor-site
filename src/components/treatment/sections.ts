import {
  Droplet, Syringe, Pill, Leaf, CircleDot, Hand, Wind, ArrowDown,
  Atom, Zap, HeartPulse, Activity, Sparkles, Waves,
} from "lucide-react";


export type TreatmentCategory =
  | "iv_drip" | "iv_bolus" | "im" | "sc" | "oral_rx" | "oral_supplement"
  | "rectal" | "topical" | "nasal" | "sublingual" | "peptide" | "procedure" | "lifestyle" | "homeopathy" | "physiotherapy";


export interface SectionDef {
  key: TreatmentCategory;
  label: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}

export const SECTIONS: SectionDef[] = [
  { key: "iv_drip",         label: "Внутривенно капельно",     short: "в/в кап.",    icon: Droplet,    hint: "разведение, скорость инфузии" },
  { key: "iv_bolus",        label: "Внутривенно струйно",      short: "в/в стр.",    icon: Syringe },
  { key: "im",              label: "Внутримышечно",            short: "в/м",         icon: Syringe },
  { key: "sc",              label: "Подкожно",                 short: "п/к",         icon: Syringe },
  { key: "oral_rx",         label: "Перорально (Rx)",          short: "Rx",          icon: Pill },
  { key: "oral_supplement", label: "БАД / нутрицевтика",       short: "БАД",         icon: Leaf },
  { key: "rectal",          label: "Ректально",                short: "ректально",   icon: CircleDot },
  { key: "topical",         label: "Накожно",                  short: "накожно",     icon: Hand },
  { key: "nasal",           label: "Назально",                 short: "назально",    icon: Wind },
  { key: "sublingual",      label: "Сублингвально",            short: "под язык",    icon: ArrowDown },
  { key: "peptide",         label: "Пептидная терапия",        short: "пептиды",     icon: Atom,       hint: "путь введения любой" },
  { key: "procedure",       label: "Процедуры",                short: "процедуры",   icon: Zap },
  { key: "lifestyle",       label: "Образ жизни",              short: "lifestyle",   icon: HeartPulse },
  { key: "homeopathy",      label: "Гомеопатия",               short: "гомеопатия",  icon: Sparkles,   hint: "препарат из реперториума Кента + потенция" },
  { key: "physiotherapy",   label: "Физиотерапия",             short: "физио",       icon: Waves,      hint: "процедура и число сеансов на курс" },


];

export const SECTION_MAP: Record<TreatmentCategory, SectionDef> =
  Object.fromEntries(SECTIONS.map(s => [s.key, s])) as any;

export const FREQUENCY_PRESETS = [
  "1 р/сут","2 р/сут","3 р/сут","ч/день","1 р/3 дня",
  "2 р/нед","3 р/нед","1 р/нед","по требованию","длительно","ежедневно",
];

export const TIME_OF_DAY = ["утро","обед","вечер","перед сном","натощак","после еды","в любое время"];

export const DILUTION_VOLUMES = [100, 200, 250, 400, 500];
export const SOLVENTS = ["0.9% NaCl","5% глюкоза","вода для инъекций","Рингер","готовый раствор"];

export { Activity };
