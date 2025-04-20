import User from "../models/user.model";
import mongoose from "mongoose";

// Controller to toggle a user in the favourites list
export const toggleFavourite = async (req: any, res: any) => {
    const { userId: userToToggleId } = req.params; // The ID of the user to favourite/unfavourite
    const myId = req.user._id; // The ID of the logged-in user

    if (!mongoose.Types.ObjectId.isValid(userToToggleId)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }

    if (myId.equals(userToToggleId)) {
         return res.status(400).json({ error: "Cannot favourite yourself" });
    }

    try {
        const me = await User.findById(myId);
        const userToToggle = await User.findById(userToToggleId);

        if (!me) {
             return res.status(404).json({ error: "Authenticated user not found" });
        }
        if (!userToToggle) {
             return res.status(404).json({ error: "User to toggle favourite not found" });
        }

        const isFavourite = me.favourites.includes(userToToggleId);

        if (isFavourite) {
            // Remove from favourites
            await me.updateOne({ $pull: { favourites: userToToggleId } });
            res.status(200).json({ message: "User removed from favourites" });
        } else {
            // Add to favourites
            await me.updateOne({ $addToSet: { favourites: userToToggleId } }); // Use $addToSet to prevent duplicates
            res.status(200).json({ message: "User added to favourites" });
        }
    } catch (error: any) {
        console.error("Error in toggleFavourite controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}; 