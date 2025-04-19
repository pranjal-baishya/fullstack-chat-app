import express from "express"
import { protectRoute } from "../middleware/auth.middleware"
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  toggleReaction,
} from "../controllers/message.controller"

const router = express.Router()

router.get("/users", protectRoute, getUsersForSidebar)
router.get("/:id", protectRoute, getMessages)

router.post("/send/:id", protectRoute, sendMessage)

router.post("/:messageId/reactions", protectRoute, toggleReaction)

export default router
