import { useState } from "react";
import { categoryLabel, formatDate, formatSize, openFile } from "../data";
import { Icon } from "./Ui.jsx";

// Files grouped under a heading per financial year (Masters have no year).
export function groupFiles(files) {
  const groups = new Map();
  for (const file of files) {
    const key = file.fy || "Masters";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  }
  return [...groups.entries()].sort(([a], [b]) => {
    if (a === "Masters") return 1;
    if (b === "Masters") return -1;
    return b.localeCompare(a);
  });
}

export default function FileList({ clientId, files, onDelete }) {
  const [opening, setOpening] = useState(null);
  const [error, setError] = useState("");

  async function open(file) {
    setOpening(file.id);
    setError("");
    try {
      await openFile(clientId, file.id);
    } catch (err) {
      setError(err.message);
    }
    setOpening(null);
  }

  return (
    <>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {groupFiles(files).map(([group, items]) => (
        <section key={group} className="file-group">
          <h3 className="group-title">
            {group}
            <span className="count">{items.length}</span>
          </h3>
          <ul className="file-list">
            {items.map((file) => (
              <li key={file.id} className="file-row">
                <span className={`file-icon cat-${file.category}`}>
                  <Icon name="file" size={20} />
                </span>
                <div className="file-main">
                  <span className="file-name">{file.name}</span>
                  <span className="file-meta">
                    {[categoryLabel(file.category), formatSize(file.size), formatDate(file.uploadedAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <div className="file-actions">
                  <button
                    className="btn btn-soft"
                    onClick={() => open(file)}
                    disabled={opening === file.id}
                  >
                    <Icon name="open" size={16} />
                    <span>{opening === file.id ? "Opening…" : "Open"}</span>
                  </button>
                  {onDelete && (
                    <button
                      className="btn btn-icon btn-danger-soft"
                      onClick={() => onDelete(file)}
                      aria-label={`Delete ${file.name}`}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
