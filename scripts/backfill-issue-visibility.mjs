import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldPath, getFirestore } from "firebase-admin/firestore";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply")) {
  throw new Error("Usage: node scripts/backfill-issue-visibility.mjs [--apply]");
}

const applyChanges = args.includes("--apply");
const projectId =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  process.env.VITE_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Set FIREBASE_PROJECT_ID or GOOGLE_CLOUD_PROJECT to the target Firebase project."
  );
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const pageSize = 500;
let cursor;
let scanned = 0;
let backfilled = 0;

while (true) {
  let pageQuery = db
    .collection("issues")
    .orderBy(FieldPath.documentId())
    .limit(pageSize);
  if (cursor) pageQuery = pageQuery.startAfter(cursor);

  const page = await pageQuery.get();
  if (page.empty) break;

  const legacyIssues = page.docs.filter(
    (document) => !Object.hasOwn(document.data(), "visibility")
  );
  scanned += page.size;
  backfilled += legacyIssues.length;

  if (applyChanges && legacyIssues.length > 0) {
    const batch = db.batch();
    for (const document of legacyIssues) {
      batch.update(document.ref, { visibility: "public" });
    }
    await batch.commit();
  }

  cursor = page.docs.at(-1);
  if (page.size < pageSize) break;
}

console.info(
  `${applyChanges ? "Backfilled" : "Would backfill"} ${backfilled} legacy issues to public visibility after scanning ${scanned} issues in ${projectId}.`
);
if (!applyChanges) {
  console.info("This was a dry run. Re-run with --apply to write the visibility field.");
}
