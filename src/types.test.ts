import { describe, expect, it } from "vitest";
import { balanceOf, collectionStatusOf, paidOf } from "./types";
import type { Payment } from "./types";

const payment = (amount: number): Payment => ({ id: "p", amount, date: "2026-10-01" });

describe("project money helpers", () => {
  it("sums payments", () => {
    expect(paidOf({ payments: [payment(1000), payment(2500)] })).toBe(3500);
    expect(paidOf({ payments: [] })).toBe(0);
  });

  it("computes a non-negative outstanding balance", () => {
    expect(balanceOf({ quotedAmount: 10000, payments: [payment(4000)] })).toBe(6000);
    expect(balanceOf({ quotedAmount: 10000, payments: [payment(12000)] })).toBe(0);
  });

  it("classifies collection status", () => {
    expect(collectionStatusOf({ quotedAmount: 10000, payments: [] })).toBe("unpaid");
    expect(collectionStatusOf({ quotedAmount: 10000, payments: [payment(4000)] })).toBe("partial");
    expect(collectionStatusOf({ quotedAmount: 10000, payments: [payment(10000)] })).toBe("paid");
    expect(collectionStatusOf({ quotedAmount: 10000, payments: [payment(12000)] })).toBe("overpaid");
    expect(collectionStatusOf({ quotedAmount: 0, payments: [payment(500)] })).toBe("overpaid");
  });
});
