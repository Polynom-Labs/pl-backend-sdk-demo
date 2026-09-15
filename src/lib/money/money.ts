export const STROOPS_PER_XLM = 10_000_000n;

export function xlmToStroops(amountXlm: number | string): bigint {
  const asNumber =
    typeof amountXlm === "number" ? amountXlm : Number.parseFloat(amountXlm);
  if (!Number.isFinite(asNumber) || asNumber < 0) {
    throw new Error("Amount must be a non-negative number of XLM");
  }
  return BigInt(Math.round(asNumber * Number(STROOPS_PER_XLM)));
}

export function stroopsToXlm(stroops: bigint): string {
  const negative = stroops < 0n;
  const abs = negative ? -stroops : stroops;
  const whole = abs / STROOPS_PER_XLM;
  const fraction = abs % STROOPS_PER_XLM;
  const padded = fraction.toString().padStart(7, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${padded}`;
}
