export interface SchoolCertificate {
  attendance?: string;
  treatmentFrom?: string;
  treatmentTo?: string;
  diagnosis?: string;
  institutionType?: string;
  institutionName?: string;
  exemptionFrom?: string;
  exemptionTo?: string;
  returnDate?: string;
  sportsFrom?: string;
  sportsTo?: string;
  vaccinationUntil?: string;
  notes?: string;
}

export function certificateValue(value?: string | null): string {
  return value?.trim() || "—";
}

export function certificateDate(value?: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("ru-RU");
}

export function initialCertificate(saved: SchoolCertificate | undefined, visitDate: string, diagnosis?: string | null): SchoolCertificate {
  return saved ? { ...saved } : {
    attendance: "консультации", treatmentFrom: visitDate.slice(0, 10), treatmentTo: visitDate.slice(0, 10),
    diagnosis: diagnosis || "", institutionType: "школы",
  };
}
