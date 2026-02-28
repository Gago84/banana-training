import { useState, useEffect } from "react";
import { db } from "./firebase/config";
import { collection, onSnapshot, doc } from "firebase/firestore";
import "./App.css";

function App() {

  const [aboutData, setAboutData] = useState(null);
  const [tab, setTab] = useState("about");
  const [tanManData, setTanManData] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

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
      <div className="hero">
        <h1>Banana Learning 🍌</h1>
      </div>
      {/* TABS */}
      <div className="tabs">

        <button
          className={tab === "about" ? "active" : ""}
          onClick={() => setTab("about")}
        >
          Giới thiệu
        </button>

        <button
          className={tab === "exercise" ? "active" : ""}
          onClick={() => setTab("exercise")}
        >
          Bài tập
        </button>

        <button
          className={tab === "software" ? "active" : ""}
          onClick={() => setTab("software")}
        >
          Phần mềm
        </button>

        <button
          className={tab === "tip" ? "active" : ""}
          onClick={() => setTab("tip")}
        >
          Mẹo tập
        </button>

        <button
          className={tab === "other" ? "active" : ""}
          onClick={() => setTab("other")}
        >
          Tản mạn
        </button>
      </div>

      <div className="content">
        {/* ABOUT */}
        {tab === "about" && (
          <>
            {aboutData ? (
              <>
                <h2>{aboutData.title}</h2>
                <div className="about-content">
                  {aboutData.content.split("\n").map((p, i) =>
                    p.trim() === ""
                      ? <br key={i}/>
                      : <p key={i}>{p}</p>
                  )}
                </div>
              </>
            ) : (
              <p>Đang tải dữ liệu...</p>
            )}
          </>
        )}

        {/* EXERCISE */}
        {tab === "exercise" && (
          <>
            <h2>Bài tập mọi nơi mọi lúc</h2>
            <p>🔥 Bài tập 1: Làm nóng cơ thể</p>
            <p>🦵 Bài tập 2: Thân dưới</p>
            <p>🎯 Bài tập 3: Thân giữa</p>
            <p>💪 Bài tập 4: Thân trên</p>

            <h2>Bài tập cho trồng chuối tự do</h2>

            <div className="exercise-card">
              <h3>🔥 Bài tập 1: Làm nóng khớp</h3>
              <div className="video-container">
                {/* desktop */}
                <iframe
                  className="video-landscape"
                  src={toEmbed(videos.WarmUp?.VideoLandScreen)}
                  allowFullScreen
                />
                {/* mobile */}
                <iframe
                  className="video-portrait"
                  src={toEmbed(videos.WarmUp?.VideoPortraitScreen)}
                  allowFullScreen
                />
              </div>
            </div>

            <h3>🧱 Bài tập 2: Mặt đối diện tường</h3>
                <div className="video-container">
                {/* desktop */}
                <iframe
                  className="video-landscape"
                  src={toEmbed(videos.FaceToWall?.VideoLandScreen)}
                  allowFullScreen
                />
                {/* mobile */}
                <iframe
                  className="video-portrait"
                  src={toEmbed(videos.FaceToWall?.VideoPortraitScreen)}
                  allowFullScreen
                />
              </div>

            <p>🧱 Bài tập 3: Lưng đối diện tường</p>
            <p>🤸 Bài tập 4: Thoát trồng chuối</p>
            <p>🎯 Bài tập 5: Trồng chuối tự do</p>
          </>
        )}
        {/* SOFTWARE */}
        {tab === "software" && (
          <>
            <h2>Phần mềm</h2>
            <p>Quét QR để tải app học trồng chuối.</p>
          </>
        )}
        {/* TIP */}
        {tab === "tip" && (
          <>
            <h2>Mẹo</h2>
            <p>🔥 Số 1: Tập dẻo vai khi đi công tác</p>
          </>
        )}
        {/* OTHER */}
        {tab === "other" && (
          <>
            <h2>Tản mạn</h2>
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
                        <span>{post.title}</span>
                        <span className={`arrow ${isExpanded ? "open" : ""}`}>
                          ▼
                        </span>
                    </div>
                    {isExpanded && (
                      <div style={{
                        padding:20,
                        whiteSpace:"pre-line"
                      }}>
                        {post.content}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p>Đang tải dữ liệu...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;