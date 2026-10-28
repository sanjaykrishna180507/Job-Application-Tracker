import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../api";

const todayStr = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

const empty = {
  company: "",
  role: "",
  jobType: "Full-time",
  appliedDate: "",
  expectedSalary: "",
  notes: "",
};

export default function AppForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/${id}`).then((res) => {
      const d = res.data.data;
      setForm({
        company: d.company,
        role: d.role,
        jobType: d.jobType,
        appliedDate: d.appliedDate.split("T")[0],
        expectedSalary: d.expectedSalary ?? "",
        notes: d.notes || "",
      });
    });
  }, [id]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // frontend validation
    if (!form.company.trim() || !form.role.trim()) return setError("Company and role are required");
    if (!form.appliedDate) return setError("Applied date is required");
    if (form.appliedDate > todayStr()) return setError("Applied date cannot be in the future");
    if (form.expectedSalary !== "" && Number(form.expectedSalary) < 0)
      return setError("Salary cannot be negative");

    try {
      if (isEdit) await api.put(`/${id}`, form);
      else await api.post("/", form);
      navigate("/");
    } catch (err) {
      // also shows the 409 duplicate message from the backend
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <Link to="/" className="muted">← Back</Link>
      <h2>{isEdit ? "Edit Application" : "Add Application"}</h2>
      {error && <p className="error">{error}</p>}

      <label>Company Name *</label>
      <input name="company" value={form.company} onChange={change} />

      <label>Job Role *</label>
      <input name="role" value={form.role} onChange={change} />

      <label>Job Type *</label>
      <select name="jobType" value={form.jobType} onChange={change}>
        <option>Full-time</option>
        <option>Internship</option>
        <option>Contract</option>
      </select>

      <label>Applied Date * {isEdit && <small className="muted">(cannot be edited)</small>}</label>
      <input
        type="date"
        name="appliedDate"
        value={form.appliedDate}
        max={todayStr()}
        disabled={isEdit}
        onChange={change}
      />

      <label>Expected Salary (optional)</label>
      <input type="number" min="0" name="expectedSalary" value={form.expectedSalary} onChange={change} />

      <label>Notes (optional)</label>
      <textarea name="notes" rows="3" value={form.notes} onChange={change} />

      <button className="btn primary" type="submit">{isEdit ? "Update" : "Save"}</button>
    </form>
  );
}
