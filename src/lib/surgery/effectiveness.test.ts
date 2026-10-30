import { describe, it, expect } from "vitest";
import { matchReferrals, effectivenessStats } from "./effectiveness";

const ref = (id: string, name: string, created: string, status = "issued") => ({
  id, full_name: name, birth_date: "2015-01-01", created_at: created, status,
});

describe("эффективность путёвок", () => {
  const journal = [
    { id: "j1", patient_name: "Иванов  Пётр", patient_birth_date: "2015-01-01", operation_date: "2026-05-10", operation_name: "X" },
    { id: "j2", patient_name: "Петров Иван", patient_birth_date: "2015-01-01", operation_date: "2026-01-01", operation_name: "Y" },
  ];

  it("операция в журнале после выдачи — прооперирован", () => {
    const [m] = matchReferrals([ref("1", "иванов пётр", "2026-05-01T10:00:00Z")], journal);
    expect(m.operated).toBe(true);
    expect(m.operation?.id).toBe("j1");
  });

  it("операция раньше выдачи путёвки не засчитывается", () => {
    const [m] = matchReferrals([ref("2", "Петров Иван", "2026-03-01T10:00:00Z")], journal);
    expect(m.operated).toBe(false);
  });

  it("процент: 1 из 2 = 50%", () => {
    const rows = matchReferrals(
      [ref("1", "Иванов Пётр", "2026-05-01"), ref("2", "Сидоров", "2026-05-01")],
      journal,
    );
    expect(effectivenessStats(rows)).toEqual({ issued: 2, operated: 1, notServed: 1, percent: 50 });
  });
});
