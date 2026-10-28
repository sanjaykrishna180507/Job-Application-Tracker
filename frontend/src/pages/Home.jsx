import { useEffect, useState } from "react";
import api from "../api";
import AppCard from "../components/AppCard";

const STATUSES = ["Applied", "Interview", "Offer", "Rejected", "Accepted", "Declined"];

export default function Home() {
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState({});
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const params = {};
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();
      const [a, s] = await Promise.all([api.get("/", { params }), api.get("/stats")]);
      setApps(a.data.data);
      setStats(s.data.data);
      setError("");
    } catch (e) {
      setError("Could not load applications. Is the backend running?");
    }
  };

  useEffect(() => {
    load();
  }, [status, search]);

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete application ${app.applicationId} (${app.company})?`)) return;
    try {
      await api.delete(`/${app._id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <>
      <div className="stats">
        <div className="stat total"><b>{stats.Total || 0}</b><span>Total</span></div>
        {STATUSES.map((s) => (
          <div key={s} className={`stat ${s}`}>
            <b>{stats[s] || 0}</b>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="filters">
        <input
          placeholder="Search by company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {!error && apps.length === 0 && <p className="muted">No applications found.</p>}

      <div className="grid">
        {apps.map((a) => (
          <AppCard key={a._id} app={a} onDelete={handleDelete} />
        ))}
      </div>
    </>
  );
}
