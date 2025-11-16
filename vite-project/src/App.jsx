import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  const [link, setLink] = useState("");
  const [data, setData] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);
  const [loadingScrape, setLoadingScrape] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const previewRef = useRef(null);

  const send = async (e) => {
    e.preventDefault();
    setLoadingScrape(true);
    setIframeLoaded(false);
    setData(null);
    setDownloadLink(null);

    try {
      const response = await axios.post("http://localhost:5000/scrape", {
        targetUrl: link,
        summary: false,
      });
      setData(response.data.html);

      // Scroll smoothly to preview area
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 600);
    } catch (error) {
      console.error("❌ Scrape failed:", error);
      alert("Failed to scrape website");
    } finally {
      setLoadingScrape(false);
    }
  };

  const download = async () => {
    setLoadingZip(true);
    try {
      const response = await axios.post("http://localhost:5000/download", {
        html: data,
        url: link,
      });
      setDownloadLink(response.data.downloadUrl);
    } catch (error) {
      console.error("❌ Failed to get download link:", error);
      alert("Failed to generate ZIP");
    } finally {
      setLoadingZip(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        color: "white",
        padding: "40px 10%",
      }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          marginBottom: "30px",
          letterSpacing: "1px",
        }}
      >
        🌐 AI Web Scraper Downloader
      </motion.h1>

      {/* Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <input
          type="text"
          placeholder="Enter website URL"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          style={{
            width: "60%",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "none",
            outline: "none",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            fontSize: "1rem",
            backdropFilter: "blur(10px)",
          }}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={send}
          disabled={loadingScrape}
          style={{
            background: "linear-gradient(90deg, #00c6ff, #0072ff)",
            border: "none",
            borderRadius: "10px",
            padding: "12px 22px",
            color: "white",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1rem",
            boxShadow: "0 4px 20px rgba(0, 114, 255, 0.3)",
          }}
        >
          {loadingScrape ? "⏳ Scraping..." : "🚀 Scrape Site"}
        </motion.button>
      </motion.div>

      {/* Loading Text */}
      {loadingScrape && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", marginTop: "15px", color: "#aee1ff" }}
        >
          Fetching website content...
        </motion.p>
      )}

      {/* Preview Section */}
      <AnimatePresence>
        {data && (
          <motion.div
            ref={previewRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              marginTop: "40px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 30px rgba(0,0,0,0.3)",
              backdropFilter: "blur(8px)",
            }}
          >
            <h3 style={{ textAlign: "center", color: "#9ee7ff" }}>🔍 Preview</h3>

            <motion.iframe
              key={link}
              srcDoc={data}
              title="Scraped Page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              onLoad={() => {
                setIframeLoaded(true);
                setTimeout(() => {
                  previewRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 300);
              }}
              style={{
                width: "100%",
                height: "70vh",
                border: "none",
                borderRadius: "10px",
                background: "white",
                overflow: "hidden",
              }}
            />

            {/* Download Section */}
            {iframeLoaded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  textAlign: "center",
                  marginTop: "25px",
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={download}
                  disabled={loadingZip}
                  style={{
                    background: "linear-gradient(90deg, #43e97b, #38f9d7)",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px 26px",
                    color: "#0f2027",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "1rem",
                    boxShadow: "0 4px 20px rgba(56,249,215,0.3)",
                  }}
                >
                  {loadingZip ? "🧩 Preparing ZIP..." : "⬇️ Generate ZIP File"}
                </motion.button>

                {downloadLink && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{ marginTop: "15px" }}
                  >
                    <a
                      href={downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        color: "#00e0ff",
                        textDecoration: "none",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}
                    >
                      Click here to download ZIP
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;




// import { useState } from "react";
// import axios from "axios";

// function App() {
//   const [link, setLink] = useState("");
//   const [data, setData] = useState(null);
//   const [downloadLink, setDownloadLink] = useState(null);
//   const [loadingScrape, setLoadingScrape] = useState(false);
//   const [loadingZip, setLoadingZip] = useState(false);
//   const [iframeLoaded, setIframeLoaded] = useState(false); // 👈 new state to track iframe rendering

//   const send = async (e) => {
//     e.preventDefault();
//     setLoadingScrape(true);
//     setIframeLoaded(false);
//     setData(null);
//     setDownloadLink(null);

//     try {
//       const response = await axios.post("http://localhost:5000/scrape", {
//         targetUrl: link,
//         summary: false,
//       });
//       setData(response.data.html);
//     } catch (error) {
//       console.error("❌ Scrape failed:", error);
//       alert("Failed to scrape website");
//     } finally {
//       setLoadingScrape(false);
//     }
//   };

//   const download = async () => {
//     setLoadingZip(true);
//     try {
//       const response = await axios.post("http://localhost:5000/download", {
//         html: data,
//         url: link,
//       });
//       setDownloadLink(response.data.downloadUrl);
//     } catch (error) {
//       console.error("❌ Failed to get download link:", error);
//       alert("Failed to generate ZIP");
//     } finally {
//       setLoadingZip(false);
//     }
//   };

//   return (
//     <div style={{ padding: "20px" }}>
//       <h1>🌐 Web Scraper Downloader</h1>

//       {/* Input + Scrape button */}
//       <input
//         type="text"
//         placeholder="Enter website URL"
//         value={link}
//         onChange={(e) => setLink(e.target.value)}
//         style={{ width: "70%", padding: "8px", marginRight: "10px" }}
//       />
//       <button onClick={send} disabled={loadingScrape}>
//         {loadingScrape ? "Scraping..." : "Scrape Site"}
//       </button>

//       {loadingScrape && <p>⏳ Fetching website content...</p>}

//       {/* Show iframe after scrape */}
//       {data && (
//         <div style={{ marginTop: "20px" }}>
//           <h3>Preview:</h3>

//           <iframe
//             srcDoc={data}
//             title="Scraped Page"
//             style={{
//               width: "100%",
//               height: "70vh",
//               border: "1px solid #ccc",
//               borderRadius: "8px",
//             }}
//             onLoad={() => {
//               console.log("✅ Iframe Rendered");
//               setIframeLoaded(true);
//             }}
//           />

//           {/* Download button only visible after iframe loads */}
//           {iframeLoaded && (
//             <div style={{ marginTop: "20px" }}>
//               <button onClick={download} disabled={loadingZip}>
//                 {loadingZip ? "Generating ZIP..." : "Generate Download Link"}
//               </button>

//               {loadingZip && <p>🧩 Preparing ZIP...</p>}

//               {downloadLink && (
//                 <div style={{ marginTop: "15px" }}>
//                   <a
//                     href={downloadLink}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     download
//                   >
//                     ⬇️ Click here to download ZIP
//                   </a>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default App;

