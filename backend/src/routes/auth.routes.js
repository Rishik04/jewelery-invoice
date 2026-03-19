import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import UserModel from "../model/user.js";
// import logger from "../utils/logger.js";

const authRoutes = express.Router();

/*
LOGIN
*/
authRoutes.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // logger.info(`Login attempt for ${email}`);
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        email: user.email,
        tenantId: user.tenantId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "6h" },
    );

    // logger.info(`User logged in ${user.email}`);

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    // logger.error("Login error", error);
    next(error);
  }
});

/*
ONBOARD OWNER
*/
authRoutes.post("/onboard", async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;

    // logger.info(`Onboarding new owner ${email}`);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: "OWNER",
      companyName,
    });

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    // logger.error("Onboard error", error);
    next(error);
  }
});

/*
REGISTER USER UNDER TENANT
*/
authRoutes.post("/:tenantId/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: "USER",
      tenantId: req.params.tenantId,
    });

    // logger.info(`User created under tenant ${req.params.tenantId}`);

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already exists",
      });
    }

    // logger.error("Register error", error);
    next(error);
  }
});

export default authRoutes;
