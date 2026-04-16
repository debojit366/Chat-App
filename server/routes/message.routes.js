import { Router } from "express";
import { sendMessage } from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

// Middleware 'protect' controller se pehle chalega
router.route("/").post(protect, sendMessage);

export default router;