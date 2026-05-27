import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  DocumentReference,
  GeoPoint,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const importDir = path.dirname(__filename);

const serviceAccountPath = path.join(importDir, "serviceAccountKey.json");
const inputPath = path.join(importDir, "data.json");
const shouldOverwrite = process.argv.includes("--overwrite");

const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));
const importedData = JSON.parse(await fs.readFile(inputPath, "utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

function deserializeValue(value) {
  if (Array.isArray(value)) {
    return value.map(deserializeValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (value.__type === "timestamp") {
    if (
      Number.isInteger(value.seconds) &&
      Number.isInteger(value.nanoseconds)
    ) {
      return new Timestamp(value.seconds, value.nanoseconds);
    }

    return Timestamp.fromDate(new Date(value.value));
  }

  if (value.__type === "geoPoint") {
    return new GeoPoint(value.latitude, value.longitude);
  }

  if (value.__type === "documentReference") {
    return db.doc(value.path);
  }

  if (value.__type === "bytes") {
    return Buffer.from(value.value, "base64");
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, childValue]) => [
      key,
      deserializeValue(childValue),
    ]),
  );
}

function deserializeData(data = {}) {
  return deserializeValue(data);
}

async function deleteCollection(collectionRef) {
  if (typeof db.recursiveDelete === "function") {
    await db.recursiveDelete(collectionRef);
    return;
  }

  const documents = await collectionRef.listDocuments();

  for (const documentRef of documents) {
    await deleteDocument(documentRef);
  }
}

async function deleteDocument(documentRef) {
  const subcollections = await documentRef.listCollections();

  for (const subcollectionRef of subcollections) {
    await deleteCollection(subcollectionRef);
  }

  await documentRef.delete();
}

async function overwriteFirestore() {
  const collections = await db.listCollections();

  for (const collectionRef of collections) {
    console.log(`Deleting collection: ${collectionRef.id}`);
    await deleteCollection(collectionRef);
  }
}

async function importDocument(documentRef, exportedDocument) {
  await documentRef.set(deserializeData(exportedDocument.data ?? {}));

  const subcollections = exportedDocument.subcollections ?? {};

  for (const [subcollectionId, documents] of Object.entries(subcollections)) {
    const subcollectionRef = documentRef.collection(subcollectionId);
    await importCollection(subcollectionRef, documents);
  }
}

async function importCollection(collectionRef, documents = []) {
  for (const exportedDocument of documents) {
    const documentRef = collectionRef.doc(exportedDocument.id);
    console.log(`Writing document: ${documentRef.path}`);
    await importDocument(documentRef, exportedDocument);
  }
}

async function importFirestore() {
  if (!importedData.collections || typeof importedData.collections !== "object") {
    throw new Error("import/data.json must contain a collections object.");
  }

  if (
    importedData.projectId &&
    importedData.projectId !== serviceAccount.project_id
  ) {
    throw new Error(
      `Project mismatch: data.json is for ${importedData.projectId}, but serviceAccountKey.json is for ${serviceAccount.project_id}.`,
    );
  }

  if (shouldOverwrite) {
    await overwriteFirestore();
  } else {
    console.log(
      "Importing without deleting existing collections. Use --overwrite to replace Firestore first.",
    );
  }

  for (const [collectionId, documents] of Object.entries(
    importedData.collections,
  )) {
    await importCollection(db.collection(collectionId), documents);
  }

  console.log("Imported data.json to Firestore successfully.");
}

importFirestore().catch((error) => {
  console.error("Failed to import Firestore data:");
  console.error(error);
  process.exitCode = 1;
});
