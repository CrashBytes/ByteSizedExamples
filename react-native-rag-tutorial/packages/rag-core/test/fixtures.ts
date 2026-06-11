import type { RagDocument } from "../src/index.js";

/** A tiny help-center corpus reused across tests. */
export const CORPUS: RagDocument[] = [
  {
    id: "billing-refunds",
    text:
      "You can request a refund within 30 days of purchase. Open Settings, tap Billing, " +
      "then choose Request Refund. Refunds are issued to the original payment method and " +
      "take 5 to 10 business days to appear. Subscriptions cancelled mid-cycle are refunded " +
      "on a prorated basis.",
    metadata: { title: "Refunds & Billing", category: "billing" },
  },
  {
    id: "account-password",
    text:
      "To reset your password, tap Forgot Password on the sign-in screen and enter your " +
      "email. We send a reset link that expires after one hour. If you do not receive the " +
      "email, check your spam folder or confirm the address on file. Error E-4012 means the " +
      "reset link has already been used.",
    metadata: { title: "Password Reset", category: "account" },
  },
  {
    id: "sync-offline",
    text:
      "The app caches your notes locally so you can read and search them offline. Changes " +
      "made offline sync automatically the next time you have a connection. If a note fails " +
      "to sync, you will see a small cloud icon with a slash; tap it to retry the upload.",
    metadata: { title: "Offline Sync", category: "sync" },
  },
];
