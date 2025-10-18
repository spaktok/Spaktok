const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (replace with your service account key path)
// For local testing, you might need to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide the path to your service account key file directly.
// Example: const serviceAccount = require("./path/to/your/serviceAccountKey.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const gifts = [
  {
    name: "Lion",
    cost: 5000,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/UBSTuDiCvqUGOfFT.jpg",
    animationUrl: "", // Placeholder for animation URL
  },
  {
    name: "Car",
    cost: 2000,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/XwAXYiANWGRdXsGt.png",
    animationUrl: "",
  },
  {
    name: "Castle",
    cost: 10000,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/eXBlCoRaYOVyBxGF.jpg",
    animationUrl: "",
  },
  {
    name: "Dance",
    cost: 500,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/qBzMmHgoLeTKXZAn.png",
    animationUrl: "",
  },
  {
    name: "Rose",
    cost: 1,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/gSzTwbsHqhWVhlVy.png",
    animationUrl: "",
  },
  {
    name: "Heart",
    cost: 5,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/IAosmKlyGoBcZgUc.jpg",
    animationUrl: "",
  },
  {
    name: "Diamond",
    cost: 100,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/saxxParcnzFEXVQC.png",
    animationUrl: "",
  },
  {
    name: "Money",
    cost: 10,
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663072894949/xVIHRmpfsJkxXZgZ.png",
    animationUrl: "",
  },
];

async function initializeGifts() {
  console.log("Initializing gifts collection...");
  for (const gift of gifts) {
    await db.collection("gifts").doc(gift.name.toLowerCase()).set(gift);
    console.log(`Added gift: ${gift.name}`);
  }
  console.log("Gifts initialization complete.");
}

initializeGifts().catch(console.error);

