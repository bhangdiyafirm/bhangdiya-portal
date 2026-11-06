import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORIES,
  MAX_FILE_BYTES,
  deleteFile,
  financialYears,
  formatPhone,
  listFiles,
  renameClient,
  setClientActive,
  uploadFile,
} from "../data";
import { EmptyState, Icon, Spinner } from "../components/Ui.jsx";
import FileList from "../components/FileList.jsx";

export default function ClientManage({ adminEmail, client, onBack }) {
  const [info, setInfo] = useState(client);
  const [files, setFiles] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    listFiles(client.id)
      .then(setFiles)
      .catch(() => setError("Could not load this client's documents."));
  }, [client.id]);

  useEffect(load, [load]);

  const active = info.active !== false;

  async function toggleAccess() {
    const next = !active;
    const question = next
      ? `Restore access for ${info.name}?`
      : `Pause access for ${info.name}? They won't be able to see their documents until you restore it.`;
    if (!window.confirm(question)) return;
    try {
      await setClientActive(info.id, next);
      setInfo({ ...info, active: next });
    } catch {
      setError("Could not change access. Please try again.");
    }
  }

  async function rename() {
    const name = window.prompt("Client name", info.name);
    if (!name || !name.trim() || name.trim() === info.name) return;
    try {
      await renameClient(info.id, name);
      setInfo({ ...info, name: name.trim() });
    } catch {
      setError("Could not rename the client.");
    }
  }

  async function remove(file) {
    if (!window.confirm(`Delete “${file.name}”? This cannot be undone.`)) return;
    try {
      await deleteFile({ adminEmail, clientId: info.id, file });
      setFiles((list) => list.filter((f) => f.id !== file.id));
    } catch (err) {
      setError(err.message || "Could not delete the file.");
    }
  }

  return (
    <>
      <button className="btn btn-ghost back" onClick={onBack}>
        <Icon name="back" size={16} /> All clients
      </button>

      <section className="hero hero-row">
        <div className="client-head">
          <span className="avatar avatar-lg">{(info.name || "?").charAt(0).toUpperCase()}</span>
          <div>
            <h1>{info.name}</h1>
            <p className="muted">
              {info.id}
              {info.mobile && ` · ${formatPhone(info.mobile)}`}
              <span className={active ? "chip chip-on" : "chip chip-off"}>
                {active ? "Active" : "Paused"}
              </span>
            </p>
          </div>
        </div>
        <div className="row-gap">
          <button className="btn btn-ghost" onClick={rename}>
            Rename
          </button>
          <button className={active ? "btn btn-danger-soft" : "btn btn-primary"} onClick={toggleAccess}>
            {active ? "Pause access" : "Restore access"}
          </button>
        </div>
      </section>

      <div className="layout">
        <div className="card">
          <h2 className="card-title">Documents</h2>
          {error && <p className="alert">{error}</p>}
          {!files && !error && <Spinner label="Loading documents" />}
          {files && files.length === 0 && (
            <EmptyState title="No documents yet">Upload the first one using the form.</EmptyState>
          )}
          {files && files.length > 0 && (
            <FileList clientId={info.id} files={files} onDelete={remove} />
          )}
        </div>
        <UploadPanel adminEmail={adminEmail} clientId={info.id} onUploaded={load} />
      </div>
    </>
  );
}

function UploadPanel({ adminEmail, clientId, onUploaded }) {
  const years = financialYears();
  const [category, setCategory] = useState("GST");
  const [fy, setFy] = useState(years[0]);
  const [picked, setPicked] = useState([]);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState(null);
  const input = useRef(null);

  function choose(event) {
    const list = [...event.target.files];
    const tooBig = list.filter((f) => f.size > MAX_FILE_BYTES);
    setPicked(list.filter((f) => f.size <= MAX_FILE_BYTES));
    setMessage(
      tooBig.length
        ? { kind: "error", text: `Skipped (over 10 MB): ${tooBig.map((f) => f.name).join(", ")}` }
        : null
    );
  }

  async function upload(event) {
    event.preventDefault();
    if (picked.length === 0) return setMessage({ kind: "error", text: "Please choose a file." });
    setMessage(null);
    let done = 0;
    try {
      for (const file of picked) {
        setProgress({ name: file.name, index: done + 1, total: picked.length, pct: 0 });
        await uploadFile({
          adminEmail,
          clientId,
          file,
          category,
          fy,
          onProgress: (pct) =>
            setProgress({ name: file.name, index: done + 1, total: picked.length, pct }),
        });
        done += 1;
      }
      setMessage({ kind: "ok", text: `${done} file${done === 1 ? "" : "s"} uploaded.` });
      setPicked([]);
      if (input.current) input.current.value = "";
    } catch (err) {
      setMessage({
        kind: "error",
        text: `${done} uploaded, then stopped: ${err.message || "upload failed"}`,
      });
    }
    setProgress(null);
    onUploaded();
  }

  return (
    <aside className="card side">
      <h2 className="card-title">
        <Icon name="upload" size={18} /> Upload
      </h2>
      <form onSubmit={upload} className="stack">
        <div>
          <span className="field-label">Type</span>
          <div className="segmented">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.id}
                className={category === c.id ? "seg active" : "seg"}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {category !== "MASTERS" && (
          <div>
            <label className="field-label" htmlFor="fy">
              Financial year
            </label>
            <select id="fy" value={fy} onChange={(e) => setFy(e.target.value)}>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="files">
            Files (up to 10 MB each)
          </label>
          <input id="files" ref={input} type="file" multiple onChange={choose} />
        </div>

        {progress && (
          <div className="progress" aria-live="polite">
            <div className="progress-label">
              {progress.index}/{progress.total} · {progress.name}
            </div>
            <div className="progress-bar">
              <span style={{ width: `${Math.round(progress.pct * 100)}%` }} />
            </div>
          </div>
        )}
        {message && (
          <p className={message.kind === "ok" ? "notice" : "alert"} role="status">
            {message.text}
          </p>
        )}
        <button className="btn btn-primary btn-block" disabled={!!progress}>
          {progress ? "Uploading…" : `Upload${picked.length > 1 ? ` ${picked.length} files` : ""}`}
        </button>
      </form>
    </aside>
  );
}
