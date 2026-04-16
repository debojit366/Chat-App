import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();

// Route: http://localhost:5000/api/v1/auth/register
router.route("/register").post(registerUser);

export default router;