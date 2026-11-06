import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { formatPhone } from "../data";
import { ContactList, Monogram } from "../components/Ui.jsx";

export default function Unregistered({ phone, failed }) {
  return (
    <div className="center-screen">
      <div className="card narrow">
        <Monogram />
        <h2>{failed ? "We couldn't open your portal" : "This number isn't registered yet"}</h2>
        <p className="muted">
          {failed
            ? "Please check your internet connection and try again. If it keeps happening, contact our office."
            : `${formatPhone(phone)} is not linked to a client account. Please contact our office and we'll set it up for you.`}
        </p>
        <ContactList />
        <div className="row-gap">
          {failed && (
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => signOut(auth)}>
            Use a different number
          </button>
        </div>
      </div>
    </div>
  );
}
