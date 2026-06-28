const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
  getMe,
  addEmployee,
  getEmployees,
  createWorkspace,
} = require("./auth.controller");
const { protect } = require("./auth.middleware");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);

// Workspace & Employee management
router.post("/employees", protect, addEmployee);
router.get("/employees", protect, getEmployees);
router.post("/workspaces", protect, createWorkspace);

module.exports = router;
