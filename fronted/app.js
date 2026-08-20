import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

async function getFilesandFolder(path = "/") {
  const response = await fetch("http://127.0.0.1:80" + path);

  if (!response.ok) {
    throw new Error("Failed to fetch directory");
  }

  const data = await response.json();

  return data;
}

function ShimmerLoader() {
  return (
    <div className="shimmer-wrapper">
      {[1, 2, 3, 4].map((index) => (
        <div className="file-item shimmer-item" key={index}>
          <div className="file-info">
            <div className="shimmer-box icon-shimmer"></div>

            <div className="file-details">
              <div className="shimmer-box title-shimmer"></div>
              <div className="shimmer-box sub-shimmer"></div>
            </div>
          </div>

          <div className="actions">
            <div className="shimmer-box btn-shimmer"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [directoryitem, setDirectoryItem] = useState([]);
  const [currentPath, setCurrentPath] = useState("/");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData(path) {
    try {
      setLoading(true);
      const data = await getFilesandFolder(path);
      setDirectoryItem(data);
      setError(null);
    } catch (err) {
      setError("Unable to load directory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(currentPath);
  }, [currentPath]);

  function openFolder(folderName) {
    const newPath =
      currentPath === "/"
        ? `/${encodeURIComponent(folderName)}`
        : `${currentPath}/${encodeURIComponent(folderName)}`;

    setCurrentPath(newPath);
  }

  return (
    <div className="header">
      <h1>📁 File System</h1>

      <p>Browse and manage files stored on the server</p>

      {loading ? (
        <ShimmerLoader />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <>
          <div className="upload-section">
            <label htmlFor="fileUpload" className="file-upload-label">
              📁 Choose File
            </label>

            <input
              type="file"
              id="fileUpload"
              onChange={async (e) => {
                const file = e.target.files[0];

                if (!file) return;

                const xhr = new XMLHttpRequest();
                xhr.open("POST", `http://127.0.0.1:80${currentPath}`, true);
                xhr.setRequestHeader("filename", file.name);
                xhr.upload.onprogress = (e) => {
                  if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100;
                    console.log(progress);
                  }
                };
                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    fetchData(currentPath)
                  }
                };
                xhr.send(file);
              }}
            />
            <span className="upload-hint">Select a file to upload</span>
          </div>
          {directoryitem.map((item) => (
            <div className="file-item" key={item.name}>
              <div className="file-info">
                <div className="file-icon">
                  {item.type === "directory" ? "📁" : "📄"}
                </div>

                <div className="file-details">
                  <span className="file-name">{item.name}</span>

                  <span className="file-type">
                    {item.type === "directory" ? "Folder" : "File"}
                  </span>
                </div>
              </div>

              <div className="actions">
                {item.type === "directory" ? (
                  <button
                    className="btn open-btn"
                    onClick={() => openFolder(item.name)}
                  >
                    Open
                  </button>
                ) : (
                  <>
                    <a
                      className="btn open-btn"
                      href={`http://127.0.0.1:80${
                        currentPath === "/" ? "" : currentPath
                      }/${encodeURIComponent(item.name)}`}
                      target="_blank"
                    >
                      Open
                    </a>

                    <a
                      className="btn download-btn"
                      href={`http://127.0.0.1:80${
                        currentPath === "/" ? "" : currentPath
                      }/${encodeURIComponent(item.name)}?action=download`}
                    >
                      Download
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
