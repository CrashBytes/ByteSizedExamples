import type { RagDocument } from "@cb/rag-core";

/**
 * The on-device knowledge base, bundled into the app so retrieval works fully
 * offline. It mirrors the server's seed corpus so both modes answer the same
 * questions — the difference you feel is retrieval quality (lexical vs Voyage)
 * and answer style (extractive snippets vs Claude prose), not coverage.
 *
 * In a real app you would sync these documents down from your backend and store
 * the embedded chunks in expo-sqlite (see the tutorial's persistence section)
 * rather than re-embedding on every launch.
 */
export const KNOWLEDGE_BASE: RagDocument[] = [
  {
    id: "getting-started",
    text:
      "Welcome to Lumen Notes. Create your first note by tapping the plus button on the home " +
      "screen. Notes support rich text, checklists, images, and voice memos. Everything you " +
      "write is saved automatically as you type — there is no save button. Organize notes into " +
      "notebooks from the sidebar, and pin important notes to the top of any list.",
    metadata: { title: "Getting Started", category: "basics" },
  },
  {
    id: "search-and-find",
    text:
      "Lumen's search bar finds notes by their content, title, and tags. Search runs instantly " +
      "and works fully offline because your notes are indexed on your device. Use quotes for an " +
      "exact phrase, and prefix a word with a hash to search a tag, for example #recipes. Recent " +
      "searches appear below the search bar so you can repeat them with one tap. Semantic search, " +
      "which finds notes by meaning rather than exact words, is available on the Pro plan.",
    metadata: { title: "Searching Your Notes", category: "basics" },
  },
  {
    id: "offline-sync",
    text:
      "Your notes are stored locally first, so you can read, edit, and search them with no " +
      "connection. When you reconnect, changes sync automatically in the background. If two " +
      "devices edit the same note while offline, Lumen keeps both versions and shows a conflict " +
      "banner so you can merge them. A cloud icon with a slash means a note has not synced yet; " +
      "tap it to retry. Sync never deletes a note you still have locally.",
    metadata: { title: "Offline & Sync", category: "sync" },
  },
  {
    id: "billing-refunds",
    text:
      "Lumen Pro is billed monthly or annually. You can request a refund within 30 days of any " +
      "charge. Open Settings, choose Subscription, then tap Request Refund. Refunds go back to " +
      "your original payment method and take 5 to 10 business days. If you cancel an annual plan " +
      "partway through, we refund the unused months on a prorated basis. Cancelling stops future " +
      "charges but leaves Pro features active until the end of the current period.",
    metadata: { title: "Billing & Refunds", category: "billing" },
  },
  {
    id: "account-password",
    text:
      "To reset your password, tap Forgot Password on the sign-in screen and enter your account " +
      "email. We send a reset link that expires after one hour for security. If the email does " +
      "not arrive, check your spam folder and confirm you used the address on file. The error " +
      "code E-4012 means the reset link has already been used — request a new one. You can also " +
      "sign in with a passkey or with your Apple or Google account.",
    metadata: { title: "Password & Sign In", category: "account" },
  },
  {
    id: "sharing-collaboration",
    text:
      "Share any note or notebook by tapping the share icon and inviting people by email. " +
      "Collaborators can be given view-only or edit access, and you can change or revoke access " +
      "at any time. Shared notes update live for everyone. To stop sharing entirely, open the " +
      "share sheet and choose Stop Sharing, which removes the note from every collaborator's app.",
    metadata: { title: "Sharing & Collaboration", category: "collaboration" },
  },
  {
    id: "export-backup",
    text:
      "You can export a single note or an entire notebook as PDF, Markdown, or plain text from " +
      "the note menu. For a full backup, open Settings, choose Data, then Export All, which " +
      "produces a zip archive of every note in Markdown plus your attachments. Automatic encrypted " +
      "backups to your own cloud storage are available on the Pro plan and run nightly.",
    metadata: { title: "Export & Backup", category: "data" },
  },
  {
    id: "privacy-encryption",
    text:
      "Lumen encrypts your notes in transit and at rest. With end-to-end encryption enabled, the " +
      "encryption key never leaves your devices, so not even Lumen can read your notes — but it " +
      "also means we cannot recover them if you lose your recovery key, so store it somewhere " +
      "safe. End-to-end encryption is on the Pro plan and is enabled per notebook in Settings " +
      "under Privacy.",
    metadata: { title: "Privacy & Encryption", category: "privacy" },
  },
];

/** A few starter questions surfaced in the UI to guide first-time users. */
export const SAMPLE_QUESTIONS: string[] = [
  "How do I get a refund?",
  "Can I use the app offline?",
  "What does error E-4012 mean?",
  "How do I export my notes to PDF?",
  "Is my data encrypted?",
];
