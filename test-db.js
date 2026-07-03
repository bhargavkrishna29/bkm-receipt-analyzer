import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Read the service account key if it exists
let serviceAccount;
try {
  const env = fs.readFileSync(".env", "utf8");
  const match = env.match(/FIREBASE_SERVICE_ACCOUNT_JSON=(.+)/);
  if (match) {
    const base64 = match[1];
    serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  }
} catch (e) {}

if (!serviceAccount) {
  console.log("No service account found in .env. Attempting Application Default Credentials...");
}

const app = initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : undefined);
const db = getFirestore(app, "spendwise");

async function checkDb() {
  console.log("Checking spendwise database...");
  try {
    const users = await db.collection("users").get();
    console.log(`Found ${users.size} users.`);
    for (const userDoc of users.docs) {
      console.log(`User: ${userDoc.id} - ${JSON.stringify(userDoc.data())}`);
      const receipts = await db.collection("users").doc(userDoc.id).collection("receipts").get();
      console.log(`  -> Found ${receipts.size} receipts.`);
      for (const r of receipts.docs) {
        console.log(`     Receipt: ${r.id} - ${r.data().merchant} ($${r.data().total})`);
      }
    }
  } catch (err) {
    console.error("Error checking db:", err);
  }
}

checkDb();
