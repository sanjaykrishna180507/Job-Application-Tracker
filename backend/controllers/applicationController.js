const Application = require("../models/Application");

const FINAL = ["Rejected", "Accepted", "Declined"];
const JOB_TYPES = ["Full-time", "Internship", "Contract"];
const TRANSITIONS = {
  Applied: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Accepted", "Declined"],
  Rejected: [],
  Accepted: [],
  Declined: [],
};

const send = (res, code, success, message, data = null) =>
  res.status(code).json({ success, message, data });

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// isOverdue is computed on every response, not stored
const withOverdue = (doc) => {
  const obj = doc.toObject();
  obj.isOverdue = obj.status === "Applied" && new Date() > new Date(obj.followUpDate);
  return obj;
};

// ---------- CREATE ----------
exports.create = async (req, res) => {
  try {
    const { company, role, jobType, appliedDate, expectedSalary, notes } = req.body;

    if (!company?.trim() || !role?.trim() || !jobType || !appliedDate)
      return send(res, 400, false, "Company, role, job type and applied date are required");
    if (!JOB_TYPES.includes(jobType)) return send(res, 400, false, "Invalid job type");

    const applied = new Date(appliedDate);
    if (isNaN(applied)) return send(res, 400, false, "Invalid applied date");
    if (applied > new Date()) return send(res, 400, false, "Applied date cannot be in the future");

    if (expectedSalary !== undefined && expectedSalary !== "" && Number(expectedSalary) < 0)
      return send(res, 400, false, "Salary cannot be negative");

    // duplicate rule (case-insensitive, only while earlier one is active)
    const duplicate = await Application.findOne({
      company: new RegExp("^" + escapeRegex(company.trim()) + "$", "i"),
      role: new RegExp("^" + escapeRegex(role.trim()) + "$", "i"),
      status: { $nin: FINAL },
    });
    if (duplicate)
      return send(res, 409, false, "An active application for this company and role already exists");

    // ID: JA-<3 letters>-<sequence per company>; uses highest existing sequence + 1
    const prefix = company.trim().replace(/\s+/g, "").substring(0, 3).toUpperCase();
    const last = await Application.find({
      applicationId: new RegExp("^JA-" + escapeRegex(prefix) + "-\\d{3}$"),
    })
      .sort({ applicationId: -1 })
      .limit(1);
    const seq = last.length ? parseInt(last[0].applicationId.split("-")[2], 10) + 1 : 1;
    const applicationId = `JA-${prefix}-${String(seq).padStart(3, "0")}`;

    const followUpDate = new Date(applied);
    followUpDate.setDate(followUpDate.getDate() + 7);

    const doc = await Application.create({
      applicationId,
      company: company.trim(),
      role: role.trim(),
      jobType,
      appliedDate: applied,
      expectedSalary: expectedSalary === "" || expectedSalary === undefined ? undefined : expectedSalary,
      notes,
      status: "Applied",
      statusHistory: [{ status: "Applied", date: new Date() }],
      followUpDate,
    });

    return send(res, 201, true, "Application created", withOverdue(doc));
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

// ---------- GET ALL (filter + search on backend) ----------
exports.getAll = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.company = new RegExp(escapeRegex(search), "i");

    const docs = await Application.find(query).sort({ createdAt: -1 });
    return send(res, 200, true, "Applications fetched", docs.map(withOverdue));
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

// ---------- STATS ----------
exports.getStats = async (req, res) => {
  try {
    const rows = await Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const stats = { Applied: 0, Interview: 0, Offer: 0, Rejected: 0, Accepted: 0, Declined: 0 };
    rows.forEach((r) => (stats[r._id] = r.count));
    stats.Total = Object.values(stats).reduce((a, b) => a + b, 0);
    return send(res, 200, true, "Stats fetched", stats);
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

// ---------- GET ONE ----------
exports.getOne = async (req, res) => {
  try {
    const doc = await Application.findById(req.params.id);
    if (!doc) return send(res, 404, false, "Application not found");
    return send(res, 200, true, "Application fetched", withOverdue(doc));
  } catch (err) {
    return send(res, 400, false, "Invalid application ID");
  }
};

// ---------- UPDATE (applicationId and appliedDate are never changed) ----------
exports.update = async (req, res) => {
  try {
    const doc = await Application.findById(req.params.id);
    if (!doc) return send(res, 404, false, "Application not found");

    const { company, role, jobType, expectedSalary, notes } = req.body;

    if (company !== undefined && !company.trim()) return send(res, 400, false, "Company cannot be empty");
    if (role !== undefined && !role.trim()) return send(res, 400, false, "Role cannot be empty");
    if (jobType && !JOB_TYPES.includes(jobType)) return send(res, 400, false, "Invalid job type");
    if (expectedSalary !== undefined && expectedSalary !== "" && Number(expectedSalary) < 0)
      return send(res, 400, false, "Salary cannot be negative");

    const newCompany = (company ?? doc.company).trim();
    const newRole = (role ?? doc.role).trim();

    if (!FINAL.includes(doc.status)) {
      const dup = await Application.findOne({
        _id: { $ne: doc._id },
        company: new RegExp("^" + escapeRegex(newCompany) + "$", "i"),
        role: new RegExp("^" + escapeRegex(newRole) + "$", "i"),
        status: { $nin: FINAL },
      });
      if (dup)
        return send(res, 409, false, "An active application for this company and role already exists");
    }

    doc.company = newCompany;
    doc.role = newRole;
    if (jobType) doc.jobType = jobType;
    if (expectedSalary !== undefined)
      doc.expectedSalary = expectedSalary === "" ? undefined : expectedSalary;
    if (notes !== undefined) doc.notes = notes;
    await doc.save();

    return send(res, 200, true, "Application updated", withOverdue(doc));
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

// ---------- STATUS CHANGE ----------
exports.changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const doc = await Application.findById(req.params.id);
    if (!doc) return send(res, 404, false, "Application not found");

    const allowed = TRANSITIONS[doc.status];
    if (!allowed.includes(status)) {
      const msg = allowed.length
        ? `Invalid transition from ${doc.status} to ${status}. Allowed: ${allowed.join(", ")}`
        : `${doc.status} is a final status and cannot be changed`;
      return send(res, 400, false, msg);
    }

    doc.status = status;
    doc.statusHistory.push({ status, date: new Date() });
    await doc.save();
    return send(res, 200, true, "Status updated", withOverdue(doc));
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};

// ---------- DELETE ----------
exports.remove = async (req, res) => {
  try {
    const doc = await Application.findById(req.params.id);
    if (!doc) return send(res, 404, false, "Application not found");

    if (doc.status === "Interview" || doc.status === "Offer")
      return send(res, 400, false, "Applications in Interview or Offer status cannot be deleted");

    await doc.deleteOne();
    return send(res, 200, true, "Application deleted");
  } catch (err) {
    return send(res, 400, false, err.message);
  }
};
