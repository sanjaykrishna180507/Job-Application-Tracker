const express = require("express");
const router = express.Router();
const c = require("../controllers/applicationController");

router.get("/stats", c.getStats); // must be before "/:id"
router.get("/", c.getAll);
router.get("/:id", c.getOne);
router.post("/", c.create);
router.put("/:id", c.update);
router.patch("/:id/status", c.changeStatus);
router.delete("/:id", c.remove);

module.exports = router;
