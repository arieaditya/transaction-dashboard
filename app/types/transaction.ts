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
}
