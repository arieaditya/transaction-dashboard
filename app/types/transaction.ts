export type TransactionStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED";

export type PaymentMethod = "VA_BCA" | "QRIS" | "EWALLET" | "CARD";

export interface Transaction {
  id: string;
  customerName: string;
  email: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  createdAt: string;
  refundable: boolean;
  fee?: number;
  city?: string;
  risk?: number;
  channel?: string;
}

export interface TransactionEvent {
  kind: "created" | "attempt" | "ok" | "wait" | "err" | "refund";
  label: string;
  at: string;
}

export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string; short: string; group: string }> = {
  QRIS:    { label: "QRIS",          short: "QR", group: "Wallet" },
  VA_BCA:  { label: "Virtual Acct.", short: "VA", group: "Bank Transfer" },
  CARD:    { label: "Card",          short: "CC", group: "Card" },
  EWALLET: { label: "E-Wallet",      short: "EW", group: "Wallet" },
};

export const STATUS_META: Record<TransactionStatus, { label: string; dot: string }> = {
  PAID:     { label: "Paid",     dot: "ok" },
  PENDING:  { label: "Pending",  dot: "warn" },
  FAILED:   { label: "Failed",   dot: "err" },
  REFUNDED: { label: "Refunded", dot: "info" },
};

export function deriveEvents(t: Transaction): TransactionEvent[] {
  const t0 = new Date(t.createdAt);
  const at = (mins: number) => new Date(t0.getTime() + mins * 60000).toISOString();
  const methodLabel = PAYMENT_METHOD_META[t.paymentMethod]?.label ?? t.paymentMethod;
  const base: TransactionEvent[] = [
    { kind: "created", label: "Payment intent created",    at: at(0) },
    { kind: "attempt", label: `${methodLabel} attempt`,    at: at(1) },
  ];
  if (t.status === "PAID")     return [...base, { kind: "ok",     label: "Authorized & captured",          at: at(2) }];
  if (t.status === "PENDING")  return [...base, { kind: "wait",   label: "Awaiting customer action",       at: at(3) }];
  if (t.status === "FAILED")   return [...base, { kind: "err",    label: "Issuer declined: do_not_honor",  at: at(2) }];
  if (t.status === "REFUNDED") return [...base,
    { kind: "ok",     label: "Authorized & captured", at: at(2) },
    { kind: "refund", label: "Refund issued",          at: at(180) },
  ];
  return base;
}
