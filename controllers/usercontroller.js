const bcrypt = require("bcryptjs");
const { sequelize } = require("../models");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_jwt_secret";

const register = async (req, res) => {
  try {
    const { fullname, email, password, isAdmin = false } = req.body;

    // Check if user already exists
    const [existing] = await sequelize.query(
      "SELECT userid FROM users WHERE email = ?",
      { replacements: [email], type: sequelize.QueryTypes.SELECT }
    );

    if (existing) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await sequelize.query(
      "INSERT INTO users (fullname, email, password, isAdmin) VALUES (?, ?, ?, ?)",
      { replacements: [fullname, email, hashedPassword, isAdmin] }
    );

    return res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch user
    const [user] = await sequelize.query(
      "SELECT userid, fullname, email, password, isAdmin, createdAt FROM users WHERE email = ?",
      { replacements: [email], type: sequelize.QueryTypes.SELECT }
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userid: user.userid,
        fullname: user.fullname,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        userid: user.userid,
        fullname: user.fullname,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const validateAdmin = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const [user] = await sequelize.query(
      "SELECT isAdmin FROM users WHERE userid = ?",
      {
        replacements: [decoded.userid],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isAdmin === true || user.isAdmin === 1 || user.isAdmin === "1") {
      return res.status(200).json({ validated: true });
    } else {
      return res.status(403).json({ message: "Not an admin." });
    }
  } catch (error) {
    console.error("Admin validation error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [users] = await sequelize.query(
      "SELECT userid, fullname, email, isAdmin, createdAt FROM users"
    );
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await sequelize.query(
      "SELECT userid FROM users WHERE userid = ?",
      { replacements: [id], type: sequelize.QueryTypes.SELECT }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await sequelize.query("DELETE FROM users WHERE userid = ?", {
      replacements: [id],
    });

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const makeUserAdmin = async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameters

  try {
    // Use sequelize.query to update the user's isAdmin status
    const result = await sequelize.query(
      "UPDATE users SET isAdmin = 1 WHERE userid = :userId",
      {
        replacements: { userId }, // Pass the userId as a replacement parameter
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    // Check if the update was successful
    if (result[0] === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optionally fetch the updated user to return their details
    const [updatedUser] = await sequelize.query(
      "SELECT userid, fullname, email, isAdmin, createdAt FROM users WHERE userid = :userId",
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return res.status(200).json({
      message: "User is now an admin",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error making user admin:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  login,
  register,
  validateAdmin,
  getAllUsers,
  deleteUser,
  makeUserAdmin,
};
