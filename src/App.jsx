import { useState, useEffect } from "react"; // 1. Thêm useEffect
import { db } from "./firebase/config"; // Đảm bảo bạn đã export db từ file config.js
import { collection, onSnapshot, query, doc } from "firebase/firestore"; // Thêm collection và query
import "./App.css";

function App() {
  
  // About data
  const [aboutData, setAboutData] = useState(null);
  const [tab, setTab] = useState("about");
  // 2. Khai báo state để chứa dữ liệu từ Firestore
const [tanManData, setTanManData] = useState([]); // Đổi {} thành []
// 1. Thêm một state để lưu ID của bài viết đang được mở
const [expandedId, setExpandedId] = useState(null);
  // 3. Lấy dữ liệu realtime từ Firestore
useEffect(() => {
  // 1. Trỏ đến cả Collection 'other' thay vì 1 ID cố định
  const colRef = collection(db, "other");
  
  // 2. Lắng nghe thay đổi trên toàn bộ collection
  const unsub = onSnapshot(colRef, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Lưu vào state dưới dạng mảng (Array)
    setTanManData(docs);
    console.log("Danh sách bài viết mới:", docs);
  });

  return () => unsub();
}, []);
      useEffect(() => {
        const colRef = collection(db, "about");

        const unsub = onSnapshot(colRef, (snapshot) => {
          if (!snapshot.empty) {
            const firstDoc = snapshot.docs[0].data();
            setAboutData(firstDoc);
          } else {
            console.log("Collection about rỗng");
          }
        }, (error) => {
          console.error("Firestore error:", error);
        });

        return () => unsub();
      }, []);
  return (
  <div className="container">

    <div className="hero">
      <h1>Banana Learning 🍌</h1>
    </div>

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
        {/* 🔹 ABOUT TAB */}
        {tab === "about" && (
          <>
            {aboutData ? (
              <>
                <h2>{aboutData.title}</h2>
                  <div className="about-content">
                    {aboutData.content.split("\n").map((paragraph, index) =>
                      paragraph.trim() === "" ? (
                        <br key={index} />
                      ) : (
                        <p key={index}>{paragraph}</p>
                      )
                    )}
                  </div>
              </>
            ) : (
              <p>Đang tải dữ liệu...</p>
            )}
          </>
        )}

      {tab === "exercise" && (
        <>
          <h2>Bài tập mọi nơi mọi lúc</h2>
            <p>🔥 Bài tập 1: Làm nóng cơ thể</p>
            <p>🦵 Bài tập 2: Thân dưới</p>
            <p>🎯 Bài tập 3: Thân giữa</p>
            <p>💪 Bài tập 4: Thân trên</p>
          <h2>Bài tập cho trồng chuối tự do</h2>
            <p>🔥 Bài tập 1: Làm nóng khớp</p>
            <p>🧱 Bài tập 2: Mặt đối diện tường</p>
            <p>🧱 Bài tập 3: Lưng đối diện tường</p>
            <p>🤸 Bài tập 4: Thoát trồng chuối</p>
            <p>🎯 Bài tập 5: Trồng chuối tự do</p>
        </>        
      )}

      {tab === "software" && (
        <>
          <h2>Phần mềm</h2>
          <p>Quét QR để tải app học trồng chuối.</p>
        </>
      )}

      {tab === "tip" && (
        <>
          <h2>Mẹo</h2>
          <p>🔥 Số 1: Tập dẻo vai khi đi công tác</p>
        </>
      )}
            
 {tab === "other" && (
  <>
    <h2>Tản mạn</h2>
    {tanManData.length > 0 ? (
      tanManData
        .sort((a, b) => {
          const indexA = a.index || 0;
          const indexB = b.index || 0;
          return Number(indexA) - Number(indexB);
        })
        .map((post) => {
          const isExpanded = expandedId === post.id;
          const displayContent = post.content || post['1'];
          const displayTitle = post.title || `Bài viết số ${post.index || ""}`;

          return (
            <div key={post.id} className="post-item" style={{ marginBottom: '15px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Tiêu đề: Click vào đây để đóng/mở */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : post.id)}
                style={{ 
                  padding: '15px', 
                  backgroundColor: isExpanded ? '#e8f5e9' : '#f9f9f9', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  color: isExpanded ? '#2e7d32' : '#333',
                  transition: '0.3s'
                }}
              >
                <span>{displayTitle}</span>
                <span>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {/* Nội dung: Chỉ hiển thị khi ID khớp với expandedId */}
              {isExpanded && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fff', 
                  lineHeight: '1.6',
                  borderTop: '1px solid #eee',
                  animation: 'fadeIn 0.3s' 
                }}>
                  <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
                    {displayContent}
                  </p>
                </div>
              )}
            </div>
          );
        })
    ) : (
      <p>Đang tải dữ liệu từ Firestore...</p>
    )}
  </>
)}

    </div>

  </div>
);

}

export default App;
