import type { Setting } from "@/generated/prisma/client";

export function publicSettings(settings: Setting) {
  return {
    submitMinute: settings.submitMinute,
    proofMinute: settings.proofMinute,
    submitHour: settings.submitHour,
    proofHour: settings.proofHour,
    rulesText: settings.rulesText,
    requirePayment: settings.requirePayment,
    qrImageUrl: settings.qrImageUrl,
    bankAccount: settings.bankAccount,
    bankName: settings.bankName,
    accountName: settings.accountName,
    fee: settings.fee,
  };
}
