import { redirect } from "next/navigation";
import { PaymentBoard } from "@/components/payment-board";
import { getPaymentBoard } from "@/lib/queries";

export default async function PayPage() {
  const board = await getPaymentBoard();
  if (!board) redirect("/");
  return <PaymentBoard board={board} />;
}
