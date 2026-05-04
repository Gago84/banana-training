import { cert, getApps, initializeApp } from "firebase-admin/app";
import { DocumentReference, GeoPoint, getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const importDir = path.dirname(__filename);

const serviceAccountPath = path.join(importDir, "serviceAccountKey.json");
const outputPath = path.join(importDir, "data.json");

const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

function serializeValue(value) {
  if (value instanceof Timestamp) {
    return {
      __type: "timestamp",
      value: value.toDate().toISOString(),
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
    };
  }

  if (value instanceof GeoPoint) {
    return {
      __type: "geoPoint",
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }

  if (value instanceof DocumentReference) {
    return {
      __type: "documentReference",
      path: value.path,
    };
  }

  if (Buffer.isBuffer(value)) {
    return {
      __type: "bytes",
      value: value.toString("base64"),
    };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, childValue]) => [key, serializeValue(childValue)]),
    );
  }

  return value;
}

async function exportDocument(documentRef) {
  const snapshot = await documentRef.get();
  const subcollections = await documentRef.listCollections();

  const exportedDocument = {
    id: snapshot.id,
    path: snapshot.ref.path,
    data: serializeValue(snapshot.data() ?? {}),
  };

  if (subcollections.length > 0) {
    exportedDocument.subcollections = {};

    for (const collectionRef of subcollections) {
      exportedDocument.subcollections[collectionRef.id] = await exportCollection(collectionRef);
    }
  }

  return exportedDocument;
}

async function exportCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  const documents = [];

  for (const documentSnapshot of snapshot.docs) {
    documents.push(await exportDocument(documentSnapshot.ref));
  }

  return documents;
}

async function exportFirestore() {
  const collections = await db.listCollections();
  const exportedData = {
    exportedAt: new Date().toISOString(),
    projectId: serviceAccount.project_id,
    collections: {},
  };

  for (const collectionRef of collections) {
    exportedData.collections[collectionRef.id] = await exportCollection(collectionRef);
  }

  await fs.writeFile(outputPath, `${JSON.stringify(exportedData, null, 2)}\n`, "utf8");

  console.log(`Exported Firestore data to ${outputPath}`);
}

exportFirestore().catch((error) => {
  console.error("Failed to export Firestore data:");
  console.error(error);
  process.exitCode = 1;
});
