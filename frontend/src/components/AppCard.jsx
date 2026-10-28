import { Link } from "react-router-dom";

export const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function AppCard({ app, onDelete }) {
  const canDelete = !["Interview", "Offer"].includes(app.status);
  return (
    <div className="card">
      <div className="card-top">
        <span className="appid">{app.applicationId}</span>
        <span className={`badge ${app.status}`}>{app.status}</span>
      </div>
      <h3>{app.company}</h3>
      <p>{app.role} · {app.jobType}</p>
      <p className="muted">Applied: {fmt(app.appliedDate)}</p>
      {app.isOverdue && <span className="badge overdue">Follow-up Overdue</span>}
      <div className="actions">
        <Link to={`/application/${app._id}`} className="btn">View</Link>
        <Link to={`/edit/${app._id}`} className="btn">Edit</Link>
        <button
          className="btn danger"
          disabled={!canDelete}
          title={canDelete ? "Delete" : "Cannot delete Interview/Offer applications"}
          onClick={() => onDelete(app)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
