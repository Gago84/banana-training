import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs/promises";

const prescriptionLabel = "REPS(TIME in second)-REST IN SECOND-SET";

function day(key, index, label, title, rows) {
  return {
    key,
    index,
    label_vi: label,
    label_en: label,
    title_vi: title,
    title_en: title,
    prescriptionLabel_vi: prescriptionLabel,
    prescriptionLabel_en: prescriptionLabel,
    rows: rows.map(([item, prescription]) => ({ item, prescription })),
  };
}

function restDay() {
  return {
    key: "sat",
    index: 6,
    label_vi: "SAT",
    label_en: "SAT",
    title_vi: "Rest",
    title_en: "Rest",
    rest: true,
    restLabel_vi: "Rest",
    restLabel_en: "Rest",
    rows: [],
  };
}

const routineLevels = [
  {
    key: "beginner",
    index: 1,
    title_vi: "Routine plan for beginner",
    title_en: "Routine plan for beginner",
    caption_vi: "Day",
    caption_en: "Day",
    source: "BEGIN-INTER-ADVANCE.xlsx",
    days: [
      day("mon", 1, "MON", "Upper (push day)", [
        ["WarmUp", "180s-0-1 set"],
        ["Pike pushup", "5 reps-60s -3 sets"],
        ["Regular pushup", "5 to 10 reps-60s-3 sets"],
        ["Diamond pushup", "5 to 10 reps-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("tue", 2, "TUE", "Core", [
        ["WarmUp", "180s-0-1 set"],
        ["Regular plank", "30s-60s-3 sets"],
        ["Hollow body", "30s-60s-3 sets"],
        ["Right Side plank", "30s-60s-3 sets"],
        ["Left side plank", "30s-60s-3 sets"],
        ["Arch Up", "30s-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("wed", 3, "WED", "Lower", [
        ["WarmUp", "180s-0-1 set"],
        ["Right Bulgarian split", "5 to 10reps-15s-3sets"],
        ["Left Bulgarian split", "5 to 10reps-15s-3sets"],
        ["Glute bridge", "5 to 10reps-15s-3sets"],
        ["Right Single Calf raise", "5 to 10reps-15s-3sets"],
        ["Left Single Calf raise", "5 to 10reps-15s-3sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("thus", 4, "THUS", "Joints", [
        ["WarmUp", "180s-0-1 set"],
        ["Overhead rod", "60s-30s-3 sets"],
        ["Dynamic Bridge", "60s-30s-3 sets"],
        ["DownDog", "60s-30s-3 sets"],
        ["Squat", "60s-30s-3 sets"],
        ["Lunge", "60s-30s-3 sets"],
        ["Catcow", "60s-30s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("fri", 5, "FRI", "Upper (pull day)", [
        ["WarmUp", "180s-0-1 set"],
        ["Regular Pull up", "5 to 10-60s-3 sets"],
        ["Row (table)", "5 to 10-60s-3 sets"],
        ["Regular Chin up", "5 to 10-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      restDay(),
      day("sunday", 7, "SUNDAY", "Handstand training", [
        ["WarmUp", "180s-0-1 set"],
        ["Back to wall", "60s-60s-3 sets"],
        ["Face to wall", "60s-60s-3 sets"],
        ["Exit", "60s-60s-3 sets"],
        ["Free", "60s-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
    ],
  },
  {
    key: "intermediate",
    index: 2,
    title_vi: "Routine plan for intermediate",
    title_en: "Routine plan for intermediate",
    caption_vi: "Day",
    caption_en: "Day",
    source: "BEGIN-INTER-ADVANCE.xlsx",
    days: [
      day("mon", 1, "MON", "Upper (push day)", [
        ["WarmUp", "180s-0-1 set"],
        ["Pike pushup", "10 reps-60s -3 sets"],
        ["Archer pushup", "10 reps-60s-3 sets"],
        ["Diamond pushup", "10 reps-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("tue", 2, "TUE", "Core", [
        ["WarmUp", "180s-0-1 set"],
        ["Elbow plank", "60s-60s-3 sets"],
        ["Hollow body", "60s-60s-3 sets"],
        ["Right Side plank", "60s-60s-3 sets"],
        ["Left side plank", "60s-60s-3 sets"],
        ["Arch Up", "60s-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("wed", 3, "WED", "Lower", [
        ["WarmUp", "180s-0-1 set"],
        ["Right Bulgarian split", "10reps-10s-3sets"],
        ["Left Bulgarian split", "10reps-10s-3sets"],
        ["Right leg glute bridge", "10reps-10s-3sets"],
        ["Left leg glute bridge", "10reps-10s-3sets"],
        ["Right Single Calf raise", "10reps-10s-3sets"],
        ["Left Single Calf raise", "10reps-10s-3sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("thus", 4, "THUS", "Joints", [
        ["WarmUp", "180s-0-1 set"],
        ["Overhead rod", "60s-10s-3 sets"],
        ["Static Bridge", "30s-10s-3 sets"],
        ["DownDog", "60s-10s-3 sets"],
        ["Deep squat", "60s-10s-3 sets"],
        ["Lunge", "60s-10s-3 sets"],
        ["Finger to ground", "60s-10s-3 sets"],
        ["Catcow", "60s-10s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("fri", 5, "FRI", "Upper (pull day)", [
        ["WarmUp", "180s-0-1 set"],
        ["Archer Pull up", "10-60s-3 sets"],
        ["Chest to Bar pull up", "10-60s-3 sets"],
        ["Archer Row", "10-60s-3 sets"],
        ["Archer Chin up", "10-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      restDay(),
      day("sunday", 7, "SUNDAY", "Handstand training", [
        ["WarmUp", "180s-0-1 set"],
        ["Face to wall", "60s-30s-3 sets"],
        ["Free", "60s-30s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
    ],
  },
  {
    key: "advance",
    index: 3,
    title_vi: "Routine plan for advance",
    title_en: "Routine plan for advance",
    caption_vi: "Day",
    caption_en: "Day",
    source: "BEGIN-INTER-ADVANCE.xlsx",
    days: [
      day("mon", 1, "MON", "Upper (push day)", [
        ["WarmUp", "180s-0-1 set"],
        ["Wall handstand pushup", "10 reps-60s -3 sets"],
        ["One left hand pushup", "3 to 5 reps-0s-3 sets"],
        ["One right hand pushup", "3 to 5 reps-60s-3 sets"],
        ["Diamond pushup", "15 reps-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("tue", 2, "TUE", "Core", [
        ["WarmUp", "180s-0-1 set"],
        ["Wrist plank", "60s-60s-3 sets"],
        ["Hollow body", "60s-60s-3 sets"],
        ["Right Side plank", "60s-60s-3 sets"],
        ["Left side plank", "60s-60s-3 sets"],
        ["Arch Up", "60s-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("wed", 3, "WED", "Lower", [
        ["WarmUp", "180s-0-1 set"],
        ["Archer Squat", "10 reps-30s-3sets"],
        ["Left Pistol Squat", "5 reps-30s-3sets"],
        ["Right Pistol Squat", "5 reps-30s-3sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("thus", 4, "THUS", "Joints", [
        ["WarmUp", "180s-0-1 set"],
        ["Overhead rod", "60s-10s-3 sets"],
        ["Static invert Plank", "60s-10s-3 sets"],
        ["DownDog", "60s-10s-3 sets"],
        ["Deep Squat", "60s-10s-3 sets"],
        ["Lunge", "60s-10s-3 sets"],
        ["Palm to ground", "60s-10s-3 sets"],
        ["Catcow", "60s-10s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      day("fri", 5, "FRI", "Upper (pull day)", [
        ["WarmUp", "180s-0-1 set"],
        ["One left Hand Pull up (Support)", "10-30s-3 sets"],
        ["One Right Hand Pull up (Support)", "10-30s-3 sets"],
        ["Archer high pull up", "10-30s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
      restDay(),
      day("sunday", 7, "SUNDAY", "Handstand training", [
        ["WarmUp", "180s-0-1 set"],
        ["Free handstand negative pushup", "5-10reps-60s-3 sets"],
        ["Free handstand pushup", "5-10reps-60s-3 sets"],
        ["Cooldown", "180s-0s-1 set"],
      ]),
    ],
  },
];

const serviceAccount = JSON.parse(
  await fs.readFile(new URL("./serviceAccountKey.json", import.meta.url), "utf8"),
);
const dataPath = new URL("./data.json", import.meta.url);
const data = JSON.parse(await fs.readFile(dataPath, "utf8"));

const routineDoc = data.collections.exercises.find((doc) => doc.id === "routine");

if (!routineDoc) {
  throw new Error("Missing exercises/routine in import/data.json");
}

routineDoc.data.levels = routineLevels;
data.exportedAt = new Date().toISOString();

await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

await getFirestore().doc("exercises/routine").set(
  {
    levels: routineLevels,
  },
  { merge: true },
);

console.log(
  `Updated exercises/routine with ${routineLevels.length} routine level tables.`,
);
