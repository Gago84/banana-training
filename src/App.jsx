import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "./firebase/config";
import qrCodeAndroid from "./assets/QRcode-android.svg";
import "./App.css";

const fallbackTabs = [
  { key: "about", index: 1, title_vi: "Gioi thieu", title_en: "About" },
  { key: "exercise", index: 2, title_vi: "Bai tap", title_en: "Exercises" },
  { key: "programs", index: 3, title_vi: "Lich tap", title_en: "Programs" },
  { key: "tip", index: 4, title_vi: "Meo tap", title_en: "Tips" },
  { key: "software", index: 5, title_vi: "Phan mem", title_en: "Software" },
  { key: "other", index: 6, title_vi: "Tan man", title_en: "Notes" },
];

function byIndex(a, b) {
  return Number(a.index || 0) - Number(b.index || 0);
}

function byOrder(a, b) {
  return Number(a.order || 0) - Number(b.order || 0);
}

function localized(item, field, lang) {
  return item?.[`${field}_${lang}`] || item?.[`${field}_en`] || item?.[field] || "";
}

function toEmbed(value) {
  if (!value) return "";

  if (!value.includes("http")) {
    return `https://www.youtube.com/embed/${value}`;
  }

  const match = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : value;
}

function textBlocks(value) {
  if (!value) return null;

  return value.split("\n").map((line, index) =>
    line.trim() === "" ? <br key={index} /> : <p key={index}>{line}</p>,
  );
}

function MediaBlock({ item }) {
  const landscape = item.videoLandscapeUrl || item.VideoLandScreen || item.videoShortUrl;
  const portrait = item.videoPortraitUrl || item.VideoPortraitScreen;

  return (
    <>
      {item.imageUrl && (
        <img
          className="content-image"
          src={item.imageUrl}
          alt={item.title_en || ""}
          referrerPolicy="no-referrer"
          onError={() => console.error("Image failed to load:", item.imageUrl)}
        />
      )}
      {landscape && (
        <div className="video-container">
          <iframe
            className="video-landscape"
            src={toEmbed(landscape)}
            title={item.title_en || item.id}
            allowFullScreen
          />
          <iframe
            className="video-portrait"
            src={toEmbed(portrait || landscape)}
            title={`${item.title_en || item.id} portrait`}
            allowFullScreen
          />
        </div>
      )}
    </>
  );
}

function MetaRow({ item }) {
  const details = [
    item.level,
    item.durationSeconds ? `${item.durationSeconds}s` : "",
    item.sets ? `${item.sets} sets` : "",
    item.reps,
  ].filter(Boolean);

  if (!details.length) return null;

  return <div className="meta-row">{details.map((detail) => <span key={detail}>{detail}</span>)}</div>;
}

function ExerciseItem({ item, lang }) {
  return (
    <article className="exercise-card">
      <h4>{localized(item, "title", lang)}</h4>
      {localized(item, "description", lang) && (
        <p>{localized(item, "description", lang)}</p>
      )}
      <MetaRow item={item} />
      <MediaBlock item={item} />
    </article>
  );
}

function App() {
  const [aboutData, setAboutData] = useState(null);
  const [tab, setTab] = useState("about");
  const [posts, setPosts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [lang, setLang] = useState("en");
  const [tabs, setTabs] = useState(fallbackTabs);
  const [exerciseIntro, setExerciseIntro] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const ref = doc(db, "appNavigation", "tabs");
    return onSnapshot(ref, (snap) => {
      const items = snap.data()?.items;
      if (Array.isArray(items) && items.length > 0) {
        setTabs(items.filter((item) => item.active !== false).sort(byIndex));
      }
    });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "about"), (snapshot) => {
      setAboutData(snapshot.docs[0]?.data() || null);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "other"), (snapshot) => {
      setPosts(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort(byIndex),
      );
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const itemUnsubs = new Map();

    const unsubSections = onSnapshot(collection(db, "exerciseIntro"), (sectionSnap) => {
      const sectionDocs = sectionSnap.docs;
      const sectionIds = new Set(sectionDocs.map((sectionDoc) => sectionDoc.id));

      itemUnsubs.forEach((unsub, sectionId) => {
        if (!sectionIds.has(sectionId)) {
          unsub();
          itemUnsubs.delete(sectionId);
        }
      });

      setExerciseIntro((currentSections) =>
        sectionDocs
          .map((sectionDoc) => ({
            id: sectionDoc.id,
            ...sectionDoc.data(),
            items: currentSections.find((section) => section.id === sectionDoc.id)?.items || [],
          }))
          .filter((section) => section.active !== false)
          .sort(byIndex),
      );

      sectionDocs.forEach((sectionDoc) => {
        if (itemUnsubs.has(sectionDoc.id)) return;

        const unsubItems = onSnapshot(
          collection(db, "exerciseIntro", sectionDoc.id, "items"),
          (itemsSnap) => {
            const items = itemsSnap.docs
              .map((itemDoc) => ({ id: itemDoc.id, ...itemDoc.data() }))
              .filter((item) => item.active !== false)
              .sort(byIndex);

            setExerciseIntro((currentSections) =>
              currentSections.map((section) =>
                section.id === sectionDoc.id ? { ...section, items } : section,
              ),
            );
          },
        );

        itemUnsubs.set(sectionDoc.id, unsubItems);
      });
    });

    return () => {
      unsubSections();
      itemUnsubs.forEach((unsub) => unsub());
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      const sectionSnap = await getDocs(collection(db, "exercises"));
      const sections = await Promise.all(
        sectionSnap.docs.map(async (sectionDoc) => {
          const groupSnap = await getDocs(collection(db, "exercises", sectionDoc.id, "groups"));
          const groups = await Promise.all(
            groupSnap.docs.map(async (groupDoc) => {
              const itemSnap = await getDocs(
                collection(db, "exercises", sectionDoc.id, "groups", groupDoc.id, "items"),
              );

              return {
                id: groupDoc.id,
                path: `exercises/${sectionDoc.id}/groups/${groupDoc.id}`,
                ...groupDoc.data(),
                items: itemSnap.docs
                  .map((itemDoc) => ({
                    id: itemDoc.id,
                    path: `exercises/${sectionDoc.id}/groups/${groupDoc.id}/items/${itemDoc.id}`,
                    ...itemDoc.data(),
                  }))
                  .filter((item) => item.active !== false)
                  .sort(byIndex),
              };
            }),
          );

          return {
            id: sectionDoc.id,
            path: `exercises/${sectionDoc.id}`,
            ...sectionDoc.data(),
            groups: groups.filter((group) => group.active !== false).sort(byIndex),
          };
        }),
      );

      if (!cancelled) {
        setExercises(sections.filter((section) => section.active !== false).sort(byIndex));
      }
    }

    loadExercises().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "programs"), (snapshot) => {
      setPrograms(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.active !== false)
          .sort(byIndex),
      );
    });

    return () => unsub();
  }, []);

  const exerciseByPath = useMemo(() => {
    const map = new Map();
    exercises.forEach((section) => {
      section.groups.forEach((group) => {
        group.items.forEach((item) => map.set(item.path, item));
      });
    });
    return map;
  }, [exercises]);

  return (
    <div className="container">
      <div className="hero">
        <h1>{lang === "vi" ? "Trong chuoi bang tay" : "Handstand Training"}</h1>
      </div>

      <div className="lang-switch">
        <button className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>
          VI
        </button>
        <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>
          EN
        </button>
      </div>

      <div className="tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={tab === item.key ? "active" : ""}
            onClick={() => setTab(item.key)}
          >
            {localized(item, "title", lang)}
          </button>
        ))}
      </div>

      <div className="content">
        {tab === "about" && (
          <>
            {aboutData ? (
              <>
                <h2>{localized(aboutData, "title", lang)}</h2>
                <div className="about-content">{textBlocks(localized(aboutData, "content", lang))}</div>
              </>
            ) : (
              <p>Loading data...</p>
            )}
          </>
        )}

        {tab === "exercise" && (
          <>
            {exerciseIntro.map((section) => (
              <section className="content-section" key={section.id}>
                <h2>{localized(section, "title", lang)}</h2>
                {localized(section, "description", lang) && <p>{localized(section, "description", lang)}</p>}
                {Array.isArray(section.imageUrls) && section.imageUrls.some(Boolean) && (
                  <div className="image-grid">
                    {section.imageUrls.filter(Boolean).map((imageUrl) => (
                      <img key={imageUrl} className="content-image" src={imageUrl} alt="" />
                    ))}
                  </div>
                )}
                <div className="item-grid">
                  {section.items.map((item) => (
                    <article className="info-card" key={item.id}>
                      <h3>{localized(item, "title", lang)}</h3>
                      <MediaBlock item={item} />
                      {localized(item, "description", lang) && <p>{localized(item, "description", lang)}</p>}
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {exercises.map((section) => (
              <section className="content-section" key={section.id}>
                <h2>{localized(section, "title", lang)}</h2>
                {localized(section, "description", lang) && <p>{localized(section, "description", lang)}</p>}
                {section.groups.map((group) => (
                  <div className="exercise-group" key={group.id}>
                    <h3>{localized(group, "title", lang)}</h3>
                    {group.items.length > 0 ? (
                      group.items.map((item) => <ExerciseItem key={item.id} item={item} lang={lang} />)
                    ) : (
                      <p className="empty-note">{lang === "vi" ? "Chua co bai tap." : "No exercises yet."}</p>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </>
        )}

        {tab === "programs" && (
          <>
            <h2>{lang === "vi" ? "Lich tap" : "Programs"}</h2>
            {programs.length > 0 ? (
              programs.map((program) => (
                <section className="program-card" key={program.id}>
                  <h3>{localized(program, "title", lang)}</h3>
                  {localized(program, "description", lang) && <p>{localized(program, "description", lang)}</p>}
                  <MetaRow
                    item={{
                      level: program.level,
                      durationSeconds: "",
                      sets: "",
                      reps: program.estimatedMinutes ? `${program.estimatedMinutes} min` : "",
                    }}
                  />
                  <ol className="program-list">
                    {(program.exerciseRefs || []).sort(byOrder).map((ref) => {
                      const exercise = exerciseByPath.get(ref.path);
                      return (
                        <li key={`${program.id}-${ref.path}`}>
                          <strong>{exercise ? localized(exercise, "title", lang) : ref.path}</strong>
                          <span>
                            {[ref.sets ? `${ref.sets} sets` : "", ref.reps].filter(Boolean).join(" - ")}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ))
            ) : (
              <p>Loading data...</p>
            )}
          </>
        )}

        {tab === "software" && (
          <>
            <h2>{lang === "vi" ? "Phan mem" : "Software"}</h2>
            <p>
              {lang === "vi"
                ? "Quet QR de tai app hoc trong chuoi."
                : "Scan the QR code to download the handstand training app."}
            </p>

            <div className="software-grid">
              <section className="software-column">
                <h3 className="software-column-title">Android - Google Play</h3>
                <div className="software-qr">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.giang.handstandtrainer"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={lang === "vi" ? "Tai ung dung Android" : "Download the Android app"}
                  >
                    <img
                      src={qrCodeAndroid}
                      alt={lang === "vi" ? "Ma QR tai ung dung Android" : "QR code to download the Android app"}
                    />
                  </a>
                </div>
                <p className="software-note">
                  {lang === "vi"
                    ? "Ma QR nay mo trang Google Play de tai ung dung Handstand Training tren dien thoai Android."
                    : "This QR code opens the Google Play page to install the Handstand Training app on Android."}
                </p>
              </section>

              <section className="software-column software-column-placeholder">
                <h3 className="software-column-title">iPhone - App Store</h3>
                <div className="software-placeholder-box">
                  <span>{lang === "vi" ? "Danh cho ma QR App Store" : "Reserved for the App Store QR code"}</span>
                </div>
                <p className="software-note">
                  {lang === "vi"
                    ? "Cot ben phai se dung cho ma QR tai ung dung tren iPhone sau."
                    : "The right column is reserved for the future iPhone App Store QR code."}
                </p>
              </section>
            </div>
          </>
        )}

        {tab === "tip" && (
          <>
            <h2>{lang === "vi" ? "Meo" : "Tips"}</h2>
            <p>{lang === "vi" ? "So 1: Tap deo vai khi di cong tac" : "Tip 1: Improve shoulder flexibility while traveling"}</p>
          </>
        )}

        {tab === "other" && (
          <>
            <h2>{lang === "vi" ? "Tan man" : "Articles"}</h2>
            {posts.length > 0 ? (
              posts.map((post) => {
                const isExpanded = expandedId === post.id;
                return (
                  <div className="post-item" key={post.id}>
                    <div
                      className="post-header"
                      onClick={() => setExpandedId(isExpanded ? null : post.id)}
                    >
                      <span>{localized(post, "title", lang)}</span>
                      <span className={`arrow ${isExpanded ? "open" : ""}`}>v</span>
                    </div>
                    {isExpanded && (
                      <div className="post-content">
                        {textBlocks(localized(post, "content", lang))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p>Loading data...</p>
            )}
          </>
        )}
      </div>

      <div className="footer">
        <a
          href="https://banana-57559.web.app/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          {lang === "vi" ? "Chinh sach bao mat" : "Privacy Policy"}
        </a>
      </div>
    </div>
  );
}

export default App;
