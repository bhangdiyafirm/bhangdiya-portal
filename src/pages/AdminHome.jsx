import { useCallback, useEffect, useState } from "react";
import { createClient, formatPhone, listClients, normalizeEmail, toE164 } from "../data";
import { EmptyState, Icon, Shell, Spinner } from "../components/Ui.jsx";
import ClientManage from "./ClientManage.jsx";

export default function AdminHome({ email, name }) {
  const [clients, setClients] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    setError("");
    listClients()
      .then(setClients)
      .catch(() => setError("Could not load clients. Please refresh the page."));
  }, []);

  useEffect(load, [load]);

  if (selected) {
    return (
      <Shell email={email} name={name} badge="Admin">
        <ClientManage
          adminEmail={email}
          client={selected}
          onBack={() => {
            setSelected(null);
            load();
          }}
        />
      </Shell>
    );
  }

  const q = search.trim().toLowerCase();
  const digits = q.replace(/\D/g, "");
  const shown = (clients || []).filter(
    (c) =>
      (c.name || "").toLowerCase().includes(q) ||
      c.id.includes(q) ||
      (digits.length >= 3 && (c.mobile || "").includes(digits))
  );
  const activeCount = (clients || []).filter((c) => c.active !== false).length;

  return (
    <Shell email={email} name={name} badge="Admin">
      <section className="hero hero-row">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Clients</h1>
          <p className="muted">Add clients, share documents and control who has access.</p>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="stat-num">{clients ? clients.length : "–"}</span>
            <span className="stat-label">Clients</span>
          </div>
          <div className="stat">
            <span className="stat-num">{clients ? activeCount : "–"}</span>
            <span className="stat-label">With access</span>
          </div>
        </div>
      </section>

      <div className="card">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={16} />
            <input
              type="search"
              placeholder="Search by name, Gmail or mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search clients"
            />
          </label>
          <button className="btn btn-primary" onClick={() => setAdding((v) => !v)}>
            <Icon name="plus" size={16} /> Add client
          </button>
        </div>

        {adding && (
          <AddClient
            onDone={() => {
              setAdding(false);
              load();
            }}
          />
        )}

        {error && <p className="alert">{error}</p>}
        {!clients && !error && <Spinner label="Loading clients" />}
        {clients && shown.length === 0 && (
          <EmptyState title={clients.length === 0 ? "No clients yet" : "No matching clients"}>
            {clients.length === 0 ? "Use “Add client” to register the first one." : null}
          </EmptyState>
        )}
        {clients && shown.length > 0 && (
          <ul className="client-list">
            {shown.map((c) => (
              <li key={c.id}>
                <button className="client-row" onClick={() => setSelected(c)}>
                  <span className="avatar">{(c.name || "?").charAt(0).toUpperCase()}</span>
                  <span className="client-main">
                    <span className="client-name">{c.name || "Unnamed client"}</span>
                    <span className="client-phone">{c.id}{c.mobile ? ` · ${formatPhone(c.mobile)}` : ""}</span>
                  </span>
                  <span className={c.active === false ? "chip chip-off" : "chip chip-on"}>
                    {c.active === false ? "Paused" : "Active"}
                  </span>
                  <span className="chev" aria-hidden="true">
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}

function AddClient({ onDone }) {
  const [name, setName] = useState("");
  const [gmail, setGmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const email = normalizeEmail(gmail);
    const phone = mobile.trim() ? toE164(mobile) : null;
    if (!name.trim()) return setError("Please enter the client's name.");
    if (!email) return setError("Please enter the client's Google (Gmail) address.");
    if (mobile.trim() && !phone) return setError("The mobile number doesn't look right.");
    setBusy(true);
    setError("");
    try {
      await createClient({ email, name, mobile: phone });
      onDone();
    } catch (err) {
      setError(err.message || "Could not add the client.");
      setBusy(false);
    }
  }

  return (
    <form className="inline-form" onSubmit={submit}>
      <div className="field">
        <label className="field-label" htmlFor="new-name">
          Client name
        </label>
        <input id="new-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="new-gmail">
          Google (Gmail) address
        </label>
        <input
          id="new-gmail"
          type="email"
          autoCapitalize="none"
          placeholder="name@gmail.com"
          value={gmail}
          onChange={(e) => setGmail(e.target.value)}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="new-mobile">
          Mobile (optional, for contact)
        </label>
        <div className="phone-field">
          <span className="phone-prefix">+91</span>
          <input
            id="new-mobile"
            type="tel"
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>
      </div>
      <button className="btn btn-primary" disabled={busy}>
        {busy ? "Adding…" : "Save client"}
      </button>
      {error && <p className="alert full">{error}</p>}
      <p className="muted full small">

        The client signs in with “Continue with Google” using exactly this address. No password is
        needed.
      </p>
    </form>
  );
}
