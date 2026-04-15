import { Router } from "express";
import { allMessages, sendMessage } from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // This ensures user is logged in

const router = Router();

// Route to fetch all messages of a chat and send a new message
router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);

export default router;