import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  DocumentReference,
  GeoPoint,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const importDir = path.dirname(__filename);

const serviceAccountPath = path.join(importDir, "serviceAccountKey.json");
const inputPath = path.join(importDir, "data.json");
const shouldOverwrite = process.argv.includes("--overwrite");
const shouldUploadAssetsOnly = process.argv.includes("--upload-assets-only");
const shouldUploadAssets =
  shouldUploadAssetsOnly || process.argv.includes("--upload-assets");

const assetUploads = [
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Equip",
      "Wall mount pullup bar.jpg",
    ),
    storagePath: "exercise/basic-equipment/wall-pullup-bar.jpg",
    contentType: "image/jpeg",
    documentPath: [
      "exerciseIntro",
      "basicEquipment",
      "items",
      "wallPullupBar",
    ],
    field: "imageUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "Support requirement",
      "Resistance Band Pull Up.mp4",
    ),
    storagePath: "exercise/basic-equipment/requirements/resistance-band-pull-up.mp4",
    contentType: "video/mp4",
    documentPath: ["exerciseIntro", "basicEquipment"],
    fieldPath: ["requirementExerciseVideoUrls", "resistanceBandPullUp"],
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "Support requirement",
      "Negative Pull Up.mp4",
    ),
    storagePath: "exercise/basic-equipment/requirements/negative-pull-up.mp4",
    contentType: "video/mp4",
    documentPath: ["exerciseIntro", "basicEquipment"],
    fieldPath: ["requirementExerciseVideoUrls", "negativePullUp"],
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "Support requirement",
      "Incline Push Up.mp4",
    ),
    storagePath: "exercise/basic-equipment/requirements/incline-push-up.mp4",
    contentType: "video/mp4",
    documentPath: ["exerciseIntro", "basicEquipment"],
    fieldPath: ["requirementExerciseVideoUrls", "inclinePushup"],
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Equip",
      "Resistance Band.jpg",
    ),
    storagePath: "exercise/basic-equipment/resistance-band.jpg",
    contentType: "image/jpeg",
    documentPath: [
      "exerciseIntro",
      "basicEquipment",
      "items",
      "resistanceBand",
    ],
    field: "imageUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "WarmUp-JumpJack.mp4",
    ),
    storagePath: "exercise/warmup/jumping-jack.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "warmup",
      "groups",
      "general",
      "items",
      "jumpingJack",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "LowBody-CalfRaise.mp4",
    ),
    storagePath: "exercise/lower-body/single-calf-raise.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "lowerBody",
      "groups",
      "calves",
      "items",
      "singleCalfRaise",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "LowBody-GluteBridge.mp4",
    ),
    storagePath: "exercise/lower-body/glute-bridge.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "lowerBody",
      "groups",
      "glute",
      "items",
      "gluteBridge",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "WarmUp-SkipRun.mp4",
    ),
    storagePath: "exercise/warmup/skipping-run.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "warmup",
      "groups",
      "general",
      "items",
      "skippingRun",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "LowBody-BungarySplit.mp4",
    ),
    storagePath: "exercise/lower-body/bungarian-split.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "lowerBody",
      "groups",
      "quads",
      "items",
      "bungarianSplit",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "Core-HollowRock.mp4",
    ),
    storagePath: "exercise/core/hollow-rock.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "core",
      "groups",
      "abs",
      "items",
      "hollowRock",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "Core-Plank.mp4",
    ),
    storagePath: "exercise/core/plank.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "core",
      "groups",
      "abs",
      "items",
      "plank",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "Core-SidePlank.mp4",
    ),
    storagePath: "exercise/core/side-plank.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "core",
      "groups",
      "obliques",
      "items",
      "sidePlank",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "Core-ArchUp.mp4",
    ),
    storagePath: "exercise/core/arch-up.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "core",
      "groups",
      "lowerBack",
      "items",
      "archUp",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "UpBody-Push-Diamond.mp4",
    ),
    storagePath: "exercise/upper-body/push/regular.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "upperBody",
      "groups",
      "push",
      "items",
      "regular",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "UpBody-Push-Regular.mp4",
    ),
    storagePath: "exercise/upper-body/push/diamond.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "upperBody",
      "groups",
      "push",
      "items",
      "diamond",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "UpBody-Push-Pike.mp4",
    ),
    storagePath: "exercise/upper-body/push/pike.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "upperBody",
      "groups",
      "push",
      "items",
      "pike",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "UpBody-Pull-PullUp.mp4",
    ),
    storagePath: "exercise/upper-body/pull/pull-up.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "upperBody",
      "groups",
      "pull",
      "items",
      "pullUp",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "UpBody-Pull-Row.mp4",
    ),
    storagePath: "exercise/upper-body/pull/row.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "upperBody",
      "groups",
      "pull",
      "items",
      "row",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "UpBody-Pull-ChinUp.mp4",
    ),
    storagePath: "exercise/upper-body/pull/chin-up.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "upperBody",
      "groups",
      "pull",
      "items",
      "chinUp",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "CoolDown-OverHeadRod.mp4",
    ),
    storagePath: "exercise/cool-down/overhead-rod.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "coolDown",
      "groups",
      "joints",
      "items",
      "overheadRod",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "CoolDown-Bridge.mp4",
    ),
    storagePath: "exercise/cool-down/bridge.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "coolDown",
      "groups",
      "joints",
      "items",
      "bridge",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "CoolDown-CatCow.mp4",
    ),
    storagePath: "exercise/cool-down/cat-cow.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "coolDown",
      "groups",
      "joints",
      "items",
      "catCow",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "CoolDown-DownDog.mp4",
    ),
    storagePath: "exercise/cool-down/down-dog.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "coolDown",
      "groups",
      "joints",
      "items",
      "downDog",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "CoolDown-Squat.mp4",
    ),
    storagePath: "exercise/cool-down/squat.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "coolDown",
      "groups",
      "joints",
      "items",
      "squat",
    ],
    field: "videoShortUrl",
  },
  {
    localPath: path.join(
      importDir,
      "..",
      "src",
      "assets",
      "Video",
      "CoolDown-Lunge.mp4",
    ),
    storagePath: "exercise/cool-down/lunge.mp4",
    contentType: "video/mp4",
    documentPath: [
      "exercises",
      "coolDown",
      "groups",
      "joints",
      "items",
      "lunge",
    ],
    field: "videoShortUrl",
  },
];

const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));
const importedData = JSON.parse(await fs.readFile(inputPath, "utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function findExportedDocument(data, documentPath) {
  let documents = data.collections?.[documentPath[0]];
  let document = null;

  for (let index = 1; index < documentPath.length; index += 2) {
    const documentId = documentPath[index];
    document = documents?.find((item) => item.id === documentId);

    if (!document) {
      return null;
    }

    const collectionId = documentPath[index + 1];
    documents = collectionId
      ? document.subcollections?.[collectionId]
      : undefined;
  }

  return document;
}

function getAssetFieldPath(asset) {
  return asset.fieldPath || [asset.field];
}

function setNestedField(data, fieldPath, value) {
  let target = data;

  for (let index = 0; index < fieldPath.length - 1; index += 1) {
    const field = fieldPath[index];

    if (!target[field] || typeof target[field] !== "object") {
      target[field] = {};
    }

    target = target[field];
  }

  target[fieldPath[fieldPath.length - 1]] = value;
}

function getNestedUpdate(fieldPath, value) {
  const [field, ...rest] = fieldPath;

  if (rest.length === 0) {
    return { [field]: value };
  }

  return {
    [field]: getNestedUpdate(rest, value),
  };
}

async function uploadAsset(asset) {
  if (!(await fileExists(asset.localPath))) {
    console.log(`Skipping missing asset: ${asset.localPath}`);
    return null;
  }

  const token = crypto.randomUUID();
  const [uploadedFile] = await bucket.upload(asset.localPath, {
    destination: asset.storagePath,
    metadata: {
      contentType: asset.contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const encodedPath = encodeURIComponent(uploadedFile.name);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}

async function uploadAssetsToStorage() {
  let changed = false;
  const updates = [];

  for (const asset of assetUploads) {
    const assetUrl = await uploadAsset(asset);
    if (!assetUrl) continue;

    const exportedDocument = findExportedDocument(
      importedData,
      asset.documentPath,
    );

    if (!exportedDocument) {
      throw new Error(
        `Could not find ${asset.documentPath.join("/")} in import/data.json.`,
      );
    }

    const fieldPath = getAssetFieldPath(asset);
    exportedDocument.data = {
      ...(exportedDocument.data ?? {}),
    };
    setNestedField(exportedDocument.data, fieldPath, assetUrl);
    updates.push({ asset, assetUrl });
    changed = true;
    console.log(
      `Uploaded ${path.basename(asset.localPath)} and updated ${asset.documentPath.join("/")}.${fieldPath.join(".")}`,
    );
  }

  if (changed) {
    importedData.exportedAt = new Date().toISOString();
    await fs.writeFile(inputPath, `${JSON.stringify(importedData, null, 2)}\n`, "utf8");
    console.log("Saved uploaded asset URLs to import/data.json.");
  }

  return updates;
}

async function updateAssetDocuments(updates) {
  for (const { asset, assetUrl } of updates) {
    const documentRef = db.doc(asset.documentPath.join("/"));
    const fieldPath = getAssetFieldPath(asset);
    console.log(`Updating document: ${documentRef.path}`);
    await documentRef.set(getNestedUpdate(fieldPath, assetUrl), { merge: true });
  }
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

  if (shouldUploadAssetsOnly) {
    const updates = await uploadAssetsToStorage();
    await updateAssetDocuments(updates);
    console.log("Uploaded assets and updated Firestore documents successfully.");
    return;
  }

  if (shouldUploadAssets) {
    await uploadAssetsToStorage();
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
