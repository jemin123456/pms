const jwt = require("jsonwebtoken");
const Tenant = require("../tenant/tenant.model");
const User = require("../user/user.model");

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || "supersecretkeyforaccess_12345",
    { expiresIn: "15m" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || "supersecretkeyforrefresh_54321",
    { expiresIn: "7d" },
  );
};

const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };

  res
    .status(statusCode)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        memberships: user.memberships,
      },
    });
};

exports.register = async (req, res, next) => {
  try {
    const { type, tenantName, tenantSlug, name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check user email uniqueness
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "User email is already registered" });
    }

    if (type === "user") {
      // 1. Register plain user (no workspace membership)
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        memberships: [], // Empty memberships
      });

      sendTokenResponse(user, 201, res);
    } else {
      // 2. Register company (creates tenant workspace + admin role)
      if (!tenantName || !tenantSlug) {
        return res.status(400).json({
          success: false,
          message: "Please provide company name and slug",
        });
      }

      const slugExists = await Tenant.findOne({
        slug: tenantSlug.toLowerCase(),
      });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: "Organization slug/subdomain is already taken",
        });
      }

      const tenant = await Tenant.create({
        name: tenantName,
        slug: tenantSlug.toLowerCase(),
      });

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        memberships: [
          {
            tenantId: tenant._id,
            role: "super admin", // Company founder gets full unrestricted access
          },
        ],
      });

      await user.populate("memberships.tenantId", "name slug");
      sendTokenResponse(user, 201, res);
    }
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    await user.populate("memberships.tenantId", "name slug");
    
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "supersecretkeyforrefresh_54321",
      );
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id).populate(
      "memberships.tenantId",
      "name slug",
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with refresh token not found",
      });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        memberships: user.memberships,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.cookie("refreshToken", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "memberships.tenantId",
      "name slug",
    );
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add employee to active workspace by User ID
// @route   POST /api/auth/employees
// @access  Private (Admin only)
exports.addEmployee = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Verify requesting user is admin or super admin in active workspace
    if (req.userRole !== "super admin" && req.userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Only administrators can add employees",
      });
    }

    // Find the user to add
    const employee = await User.findById(userId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please verify the ID.",
      });
    }

    // Check if already member
    const isMember = employee.memberships.some(
      (m) => m.tenantId.toString() === req.tenantId.toString(),
    );

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "User is already an employee in this workspace",
      });
    }

    // Add employee membership (default role: 'developer')
    employee.memberships.push({
      tenantId: req.tenantId,
      role: "developer",
    });

    await employee.save();

    res.status(200).json({
      success: true,
      message: `${employee.name} has been added as an employee to your workspace!`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees in active workspace
// @route   GET /api/auth/employees
// @access  Private
exports.getEmployees = async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res
        .status(400)
        .json({ success: false, message: "No active workspace selected" });
    }

    const employees = await User.find({
      "memberships.tenantId": req.tenantId,
    }).select("name email memberships");

    const mappedEmployees = employees.map((emp) => {
      const memb = emp.memberships.find(
        (m) => m.tenantId.toString() === req.tenantId.toString(),
      );
      return {
        id: emp._id,
        name: emp.name,
        email: emp.email,
        role: memb ? memb.role : "employee",
      };
    });

    res.status(200).json({ success: true, data: mappedEmployees });
  } catch (error) {
    next(error);
  }
};

// @desc    Create workspace from dashboard
// @route   POST /api/auth/workspaces
// @access  Private
exports.createWorkspace = async (req, res, next) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Workspace name and slug are required",
      });
    }

    const slugExists = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (slugExists) {
      return res
        .status(400)
        .json({ success: false, message: "Workspace slug is already taken" });
    }

    const tenant = await Tenant.create({
      name,
      slug: slug.toLowerCase(),
    });

    // Workspace creator becomes super admin of new workspace
    req.user.memberships.push({
      tenantId: tenant._id,
      role: "super admin",
    });

    await req.user.save();
    await req.user.populate("memberships.tenantId", "name slug");

    res.status(201).json({
      success: true,
      data: req.user,
      newWorkspaceId: tenant._id,
    });
  } catch (error) {
    next(error);
  }
};
