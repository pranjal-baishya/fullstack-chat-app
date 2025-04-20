import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { toggleFavourite } from "../controllers/user.controller";

const router = express.Router();

// Route to toggle favourite status of a user
router.put("/:userId/favourite", protectRoute, toggleFavourite);

// Add other user-related routes here if needed in the future

export default router; 