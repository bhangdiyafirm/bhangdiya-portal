import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, listFiles } from "../data";
import { FIRM } from "../firm";
import { ContactList, EmptyState, Icon, Shell, Spinner } from "../components/Ui.jsx";
import FileList from "../components/FileList.jsx";

export default function ClientHome({ email, name, profile }) {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [search, setSearch] = useState("");
  const active = profile?.active !== false;

  useEffect(() => {
    if (!active) return;
    listFiles(email)
      .then(setFiles)
      .catch(() => setError("We couldn't load your documents. Please refresh the page."));
  }, [email, active]);

  const counts = useMemo(() => {
    const result = { ALL: files?.length ?? 0 };
    for (const c of CATEGORIES) result[c.id] = files?.filter((f) => f.category === c.id).length ?? 0;
    return result;
  }, [files]);

  const years = useMemo(
    () => [...new Set((files || []).map((f) => f.fy).filter(Boolean))].sort().reverse(),
    [files]
  );

  const shown = (files || []).filter(
    (f) =>
      (category === "ALL" || f.category === category) &&
      (year === "ALL" || f.fy === year) &&
      f.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const firstName = (name || "").split(" ")[0];

  return (
    <Shell email={email} name={name}>
      <section className="hero">
        <div>
          <p className="eyebrow">Client Portal</p>
          <h1>Welcome{firstName ? `, ${firstName}` : ""}</h1>
          <p className="muted">
            Documents shared with you by {FIRM.name}. Tap any document to open or download it.
          </p>
        </div>
      </section>

      {!active ? (
        <div className="card">
          <EmptyState title="Your access is paused">
            Please contact our office to restore access to your documents.
          </EmptyState>
          <ContactList />
        </div>
      ) : (
        <div className="layout">
          <div className="card">
            <div className="tabs" role="tablist" aria-label="Document type">
              {[{ id: "ALL", label: "All documents" }, ...CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={category === c.id}
                  className={category === c.id ? "tab active" : "tab"}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                  <span className="count">{counts[c.id]}</span>
                </button>
              ))}
            </div>

            <div className="toolbar">
              <label className="search">
                <Icon name="search" size={16} />
                <input
                  type="search"
                  placeholder="Search documents"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search documents"
                />
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label="Financial year"
              >
                <option value="ALL">All years</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>

            {error && <p className="alert">{error}</p>}
            {!files && !error && <Spinner label="Loading documents" />}
            {files && shown.length === 0 && (
              <EmptyState title={files.length === 0 ? "No documents yet" : "Nothing matches"}>
                {files.length === 0
                  ? "When our office shares a document with you, it will appear here."
                  : "Try a different search, type or year."}
              </EmptyState>
            )}
            {files && shown.length > 0 && <FileList clientId={email} files={shown} />}
          </div>

          <aside className="card side">
            <h3>Need help?</h3>
            <p className="muted">Call or email us and mention your registered mobile number.</p>
            <ContactList />
          </aside>
        </div>
      )}
    </Shell>
  );
}
