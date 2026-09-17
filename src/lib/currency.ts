/** INR currency formatting + parsing (charges may be typed loosely). */
export const formatINR = (n: number): string => "\u20B9" + Math.round(n).toLocaleString("en-IN");

/** Extract the numeric amount from a loosely typed charges string ("25,000", "₹25000 ..."). */
export const parseCharges = (raw: string): number => {
  const cleaned = (raw || "").replace(/[^\d.]/g, "");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};
