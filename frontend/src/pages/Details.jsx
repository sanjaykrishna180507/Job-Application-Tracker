import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { fmt } from "../components/AppCard";

const NEXT = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"],
  Rejected: [],
  Accepted: [],
  Declined: [],
};

export default function Details() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [next, setNext] = useState("");
  const [error, setError] = useState("");

  const load = () => api.get(`/${id}`).then((r) => setApp(r.data.data));
  useEffect(() => {
    load();
  }, [id]);

  const updateStatus = async () => {
    if (!next) return setError("Please choose a status");
    try {
      await api.patch(`/${id}/status`, { status: next });
      setNext("");
      setError("");
      load();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status");
    }
  };

  if (!app) return <p>Loading...</p>;
  const options = NEXT[app.status];

  return (
    <div className="details">
      <Link to="/" className="muted">← Back</Link>
      <h2>
        {app.company} <span className={`badge ${app.status}`}>{app.status}</span>
      </h2>
      <p><b>ID:</b> {app.applicationId}</p>
      <p><b>Role:</b> {app.role} ({app.jobType})</p>
      <p><b>Applied:</b> {fmt(app.appliedDate)}</p>
      <p>
        <b>Follow-up:</b> {fmt(app.followUpDate)}
        {app.isOverdue && <span className="badge overdue">Follow-up Overdue</span>}
      </p>
      {app.expectedSalary !== undefined && app.expectedSalary !== null && (
        <p><b>Expected Salary:</b> ₹{app.expectedSalary}</p>
      )}
      {app.notes && <p><b>Notes:</b> {app.notes}</p>}

      {options.length > 0 ? (
        <div className="status-box">
          <select value={next} onChange={(e) => setNext(e.target.value)}>
            <option value="">Change status...</option>
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <button className="btn primary" onClick={updateStatus}>Update</button>
        </div>
      ) : (
        <p className="muted">This is a final status and cannot be changed.</p>
      )}
      {error && <p className="error">{error}</p>}

      <h3>Status Timeline</h3>
      <ul className="timeline">
        {app.statusHistory.map((h, i) => (
          <li key={i}>
            <span className={`dot ${h.status}`}></span>
            <div>
              <b>{h.status}</b>
              <br />
              <small className="muted">{new Date(h.date).toLocaleString("en-IN")}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
