import { useState, useEffect } from "react";
import { db } from "./firebase/config";
import { collection, onSnapshot, doc } from "firebase/firestore";
import qrCodeAndroid from "./assets/QRcode-android.svg";
import "./App.css";

function App() {

  const [aboutData, setAboutData] = useState(null);
  const [tab, setTab] = useState("about");
  const [tanManData, setTanManData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  // Đặt thêm language state
  const [lang, setLang] = useState("en");
  // Thêm state để lưu video
  const [videos, setVideos] = useState({});

  /* LOAD OTHER POSTS */
  useEffect(() => {
    const colRef = collection(db, "other");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTanManData(docs);
    });
    return () => unsub();
  }, []);

  /* LOAD ABOUT */
  useEffect(() => {
    const colRef = collection(db, "about");
    const unsub = onSnapshot(colRef, (snapshot) => {
      if (!snapshot.empty) {
        setAboutData(snapshot.docs[0].data());
      }
    });
    return () => unsub();
  }, []);

  /* LOAD handstand in firestore VIDEO */
  useEffect(() => {
    const docNames = [
      "WarmUp",
      "FaceToWall",
      "BackToWall",
      "ExitHandstand",
      "FreeHandstand"
    ];
    const unsubs = docNames.map(name => {
      const ref = doc(db, "HandStand", name);
      return onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          setVideos(prev => ({
            ...prev,
            [name]: snap.data()
          }));
        }
      });
    });
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  // Add function to convert video link from firebase store
  function toEmbed(value) {
    if (!value) return "";
    // nếu chỉ là video ID
    if (!value.includes("http")) {
      return `https://www.youtube.com/embed/${value}`;
    }
    // nếu là full youtube link
    const reg =
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const match = value.match(reg);
    return match
      ? `https://www.youtube.com/embed/${match[1]}`
      : value;
  }

  return (
    <div className="container">

        {/* Title */}
        <div className="hero">
          <h1>{lang==="vi" ? "Trồng chuối bằng tay" : "Handstand Training"}</h1>
        </div>

        {/* Add language button */}
        <div className="lang-switch">
          <button
            className={lang==="vi"?"active":""}
            onClick={()=>setLang("vi")}
          >
            VI
          </button>
          <button
            className={lang==="en"?"active":""}
            onClick={()=>setLang("en")}
          >
            EN
          </button>
        </div>

        {/* TABS */}
        <div className="tabs">

          <button
            className={tab==="about" ? "active" : ""}
            onClick={() => setTab("about")}
          >
            {lang==="vi"?"Giới thiệu":"About"}
          </button>

          <button
            className={tab==="exercise" ? "active" : ""}
            onClick={() => setTab("exercise")}
          >
            {lang==="vi"?"Bài tập":"Exercises"}
          </button>

          <button
            className={tab==="tip" ? "active" : ""}
            onClick={() => setTab("tip")}
          >
            {lang==="vi"?"Mẹo tập":"Tips"}
          </button>

          <button
            className={tab==="software" ? "active" : ""}
            onClick={() => setTab("software")}
          >
            {lang==="vi" ? "Phần mềm" : "Software"}
          </button>

          <button
            className={tab==="other" ? "active" : ""}
            onClick={() => setTab("other")}
          >
            {lang==="vi"?"Tản mạn":"Notes"}
          </button>

        </div>

      <div className="content">

        {/* ABOUT */}
        {tab === "about" && (
          <>
            {aboutData ? (
              <>
                <h2>
                  {lang==="vi"
                    ? aboutData.title_vi
                    : aboutData.title_en}
                </h2>
                <div className="about-content">
                  {(lang==="vi"
                    ? aboutData.content_vi
                    : aboutData.content_en
                  ).split("\n").map((p,i)=>
                    p.trim()===""
                      ? <br key={i}/>
                      : <p key={i}>{p}</p>
                  )}
                </div>
              </>
            ) : (
              <p>Loading data...</p>
            )}
          </>
        )}

        {/* EXERCISE */}
        {tab === "exercise" && (
          <>
            <h2>
              {lang === "vi"
                ? "Bài tập mọi nơi mọi lúc"
                : "Train Anywhere, Anytime & No Equipment Needed"}
            </h2>

              <p>
                🔥 {lang === "vi"
                  ? "Bài tập 1: Làm nóng cơ thể"
                  : "Exercise 1: Warm up your body"}
              </p>

              <p>
                🦵 {lang === "vi"
                  ? "Bài tập 2: Thân dưới"
                  : "Exercise 2: Lower body"}
              </p>

              <p>
                🎯 {lang === "vi"
                  ? "Bài tập 3: Thân giữa"
                  : "Exercise 3: Core"}
              </p>

              <p>
                💪 {lang === "vi"
                  ? "Bài tập 4: Thân trên"
                  : "Exercise 4: Upper body"}
              </p>

            <h2>
              {lang === "vi"
                ? "Bài tập cho trồng chuối tự do"
                : "Exercises for Free Handstand"}
            </h2>

            <div className="exercise-card">
              <h3>
                🔥 {lang === "vi"
                  ? "Bài tập 1: Làm nóng khớp"
                  : "Exercise 1: Joint Warm-up"}
              </h3>
              <div className="video-container">
                <iframe
                  className="video-landscape"
                  src={toEmbed(videos.WarmUp?.VideoLandScreen)}
                  allowFullScreen
                />
                <iframe
                  className="video-portrait"
                  src={toEmbed(videos.WarmUp?.VideoPortraitScreen)}
                  allowFullScreen
                />
              </div>
            </div>

            <div className="exercise-card">
              <h3>
                🧱 {lang === "vi"
                  ? "Bài tập 2: Mặt đối diện tường"
                  : "Exercise 2: Face to Wall"}
              </h3>
              <div className="video-container">
                <iframe
                  className="video-landscape"
                  src={toEmbed(videos.FaceToWall?.VideoLandScreen)}
                  allowFullScreen
                />
                <iframe
                  className="video-portrait"
                  src={toEmbed(videos.FaceToWall?.VideoPortraitScreen)}
                  allowFullScreen
                />
              </div>
            </div>

            <div className="exercise-card">
              <h3>
                🧱 {lang === "vi"
                  ? "Bài tập 3: Lưng đối diện tường"
                  : "Exercise 3: Back to Wall"}
              </h3>
              <div className="video-container">
                <iframe
                  className="video-landscape"
                  src={toEmbed(videos.BackToWall?.VideoLandScreen)}
                  allowFullScreen
                />
                <iframe
                  className="video-portrait"
                  src={toEmbed(videos.BackToWall?.VideoPortraitScreen)}
                  allowFullScreen
                />
              </div>
            </div>

            <div className="exercise-card">
              <h3>
                🤸 {lang === "vi"
                  ? "Bài tập 4: Thoát trồng chuối"
                  : "Exercise 4: Safe Exit"}
              </h3>
              <div className="video-container">
                <iframe
                  className="video-landscape"
                  src={toEmbed(videos.ExitHandstand?.VideoLandScreen)}
                  allowFullScreen
                />
                <iframe
                  className="video-portrait"
                  src={toEmbed(videos.ExitHandstand?.VideoPortraitScreen)}
                  allowFullScreen
                />
              </div>
            </div>

            <div className="exercise-card">
              <h3>
                🎯 {lang === "vi"
                  ? "Bài tập 5: Trồng chuối tự do"
                  : "Exercise 5: Free Handstand"}
              </h3>
              <div className="video-container">
                <iframe
                  className="video-landscape"
                  src={toEmbed(videos.FreeHandstand?.VideoLandScreen)}
                  allowFullScreen
                />
                <iframe
                  className="video-portrait"
                  src={toEmbed(videos.FreeHandstand?.VideoPortraitScreen)}
                  allowFullScreen
                />
              </div>
            </div>

          </>
        )}

        {/* SOFTWARE */}
        {tab === "software" && (
          <>
            <h2>
              {lang === "vi" ? "Phần mềm" : "Software"}
            </h2>

            <p>
              {lang === "vi"
                ? "Quét QR để tải app học trồng chuối."
                : "Scan the QR code to download the handstand training app."}
            </p>

            <div className="software-grid">
              <section className="software-column">
                <h3 className="software-column-title">
                  {lang === "vi" ? "Android - Google Play" : "Android - Google Play"}
                </h3>

                <div className="software-qr">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.giang.handstandtrainer"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={lang === "vi" ? "Tải ứng dụng Android" : "Download the Android app"}
                  >
                    <img
                      src={qrCodeAndroid}
                      alt={lang === "vi" ? "Mã QR tải ứng dụng Android" : "QR code to download the Android app"}
                    />
                  </a>
                </div>

                <p className="software-note">
                  {lang === "vi"
                    ? "Mã QR này mở trang Google Play để tải ứng dụng Handstand Training trên điện thoại Android."
                    : "This QR code opens the Google Play page to install the Handstand Training app on Android."}
                </p>
              </section>

              <section className="software-column software-column-placeholder">
                <h3 className="software-column-title">
                  {lang === "vi" ? "iPhone - App Store" : "iPhone - App Store"}
                </h3>

                <div className="software-placeholder-box">
                  <span>
                    {lang === "vi" ? "Dành chỗ cho mã QR App Store" : "Reserved for the App Store QR code"}
                  </span>
                </div>

                <p className="software-note">
                  {lang === "vi"
                    ? "Cột bên phải sẽ dùng cho mã QR tải ứng dụng trên iPhone sau."
                    : "The right column is reserved for the future iPhone App Store QR code."}
                </p>
              </section>
            </div>
          </>
        )}

        {/* TIP */}
        {tab === "tip" && (
          <>
            <h2>
              {lang === "vi" ? "Mẹo" : "Tips"}
            </h2>

            <p>
              🔥 {lang === "vi"
                ? "Số 1: Tập dẻo vai khi đi công tác"
                : "Tip 1: Improve shoulder flexibility while traveling"}
            </p>
          </>
        )}

        {/* OTHER */}
        {tab === "other" && (
          <>
            <h2>
              {lang === "vi" ? "Tản mạn" : "Articles"}
            </h2>
            {tanManData.length > 0 ? (
              tanManData
              .sort((a,b)=>(a.index||0)-(b.index||0))
              .map(post=>{
                const isExpanded = expandedId === post.id;
                return (
                  <div key={post.id} className="post-item">
                    <div
                      onClick={() =>
                        setExpandedId(isExpanded ? null : post.id)
                      }
                      className="post-header"
                    >
                        <span>
                          {lang === "vi" ? post.title_vi : post.title_en}
                        </span>
                        <span className={`arrow ${isExpanded ? "open" : ""}`}>
                          ▼
                        </span>
                    </div>
                    {isExpanded && (
                      <div style={{
                        padding:20,
                        whiteSpace:"pre-line"
                      }}>
                        {lang === "vi" ? post.content_vi : post.content_en}
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

      {/* 🔥 ADD HERE: Privacy Policy Footer */}
      <div
        style={{
          marginTop: 40,
          padding: 20,
          textAlign: "center",
          fontSize: 14,
          color: "#666",
          borderTop: "1px solid #eee"
        }}
      >
        <a
          href="https://banana-57559.web.app/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007AFF", textDecoration: "none" }}
        >
          {lang === "vi" ? "Chính sách bảo mật" : "Privacy Policy"}
        </a>
      </div>

    </div>
  );
}

export default App;
