import { describe, it, expect } from "vitest";
import { joinOperations, splitOperations } from "./referral";

describe("несколько операций в путёвке", () => {
  it("одна операция хранится без номера", () => {
    expect(joinOperations(["Варикоцелэктомия", " "])).toBe("Варикоцелэктомия");
  });
  it("несколько операций нумеруются 1., 2., 3.", () => {
    expect(joinOperations(["А", "Б", "В"])).toBe("1. А\n2. Б\n3. В");
  });
  it("обратное разбиение возвращает список", () => {
    expect(splitOperations("1. А\n2. Б")).toEqual(["А", "Б"]);
  });
});
