import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { FIRM } from "../firm";
import { formatPhone } from "../data";

const paths = {
  file: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4",
  phone:
    "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10",
  back: "M15 18l-6-6 6-6",
  plus: "M12 5v14M5 12h14",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  shield: "M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z",
  check: "M5 12.5 10 17l9-10",
  open: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
};

export function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Spinner({ label }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" />
      {label && <span>{label}…</span>}
    </div>
  );
}

export function Monogram({ small }) {
  return <span className={small ? "monogram monogram-sm" : "monogram"}>B&amp;B</span>;
}

export function ContactList() {
  return (
    <ul className="contact-list">
      <li>
        <Icon name="phone" size={16} />
        <span>
          {FIRM.phones.map((p, i) => (
            <span key={p}>
              {i > 0 && " / "}
              <a href={`tel:+91${p}`}>{p}</a>
            </span>
          ))}
        </span>
      </li>
      <li>
        <Icon name="mail" size={16} />
        <a href={`mailto:${FIRM.email}`}>{FIRM.email}</a>
      </li>
      <li>
        <Icon name="clock" size={16} />
        <span>{FIRM.hours}</span>
      </li>
    </ul>
  );
}

export function Shell({ phone, name, badge, children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <Monogram small />
            <div>
              <div className="brand-name">{FIRM.name}</div>
              <div className="brand-sub">
                {FIRM.tagline}
                {badge && <span className="badge">{badge}</span>}
              </div>
            </div>
          </div>
          <div className="topbar-user">
            <div className="who">
              <span className="who-name">{name || "Welcome"}</span>
              <span className="who-phone">{formatPhone(phone)}</span>
            </div>
            <button className="btn btn-ghost" onClick={() => signOut(auth)}>
              <Icon name="logout" size={16} />
              <span className="hide-sm">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <strong>
              M/s {FIRM.name}, {FIRM.tagline}
            </strong>
            <div className="muted">© {new Date().getFullYear()} All rights reserved.</div>
          </div>
          <ContactList />
        </div>
      </footer>
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name="file" size={26} />
      </div>
      <p className="empty-title">{title}</p>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}
