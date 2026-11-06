import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { ContactList, Monogram } from "../components/Ui.jsx";

export default function Unregistered({ email, failed }) {
  return (
    <div className="center-screen">
      <div className="card narrow">
        <Monogram />
        <h2>{failed ? "We couldn't open your portal" : "This account isn't registered yet"}</h2>
        <p className="muted">
          {failed ? (
            "Please check your internet connection and try again. If it keeps happening, contact our office."
          ) : (
            <>
              <strong>{email}</strong> is not linked to a client account. Please contact our office
              and tell us this Gmail address. If you have another Google account registered with us,
              sign in with that one instead.
            </>
          )}
        </p>
        <ContactList />
        <div className="row-gap">
          {failed && (
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => signOut(auth)}>
            Use a different Google account
          </button>
        </div>
      </div>
    </div>
  );
}
