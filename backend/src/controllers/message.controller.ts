import User from "../models/user.model"
import Message from "../models/message.model"
import cloudinary from "../lib/cloudinary"
import { io, getReceiverSocketId, getSenderSocketId } from "../lib/socket"
import mongoose from "mongoose"

export const getUsersForSidebar = async (req: any, res: any) => {
  try {
    const loggedInUserId = req.user._id
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password")

    res.status(200).json(filteredUsers)
  } catch (error: any) {
    console.error("Error in getUsersForSidebar: ", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getMessages = async (req: any, res: any) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const { cursor } = req.query; // Get cursor from query params
    const limit = 20; // Number of messages to fetch per request

    const query: any = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };

    // If a cursor is provided, fetch messages older than the cursor
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Sort descending to get the latest first (or oldest relative to cursor)
      .limit(limit)
      .populate('reactions.userId', 'fullName profilePic');

    const reversedMessages = [...messages].reverse();

    // Determine if there are more older messages to load
    let hasMore = false;
    if (messages.length > 0) {
      const oldestMessageTimestamp = messages[0].createdAt; // Before reversing, the first is the oldest in this batch
      const olderMessagesCount = await Message.countDocuments({
        ...query, // Use the same base query
        createdAt: { $lt: oldestMessageTimestamp }, // Check for messages strictly older
      });
      hasMore = olderMessagesCount > 0;
    }

    res.status(200).json({ messages: reversedMessages, hasMore }); // Send messages and hasMore flag

  } catch (error: any) {
    console.log("Error in getMessages controller: ", error.message);
    // Check for invalid date format in cursor
    if (error instanceof Error && error.message.includes("Invalid time value")) {
        return res.status(400).json({ error: "Invalid cursor date format" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req: any, res: any) => {
  try {
    const { text, image } = req.body
    const { id: receiverId } = req.params
    const senderId = req.user._id

    let imageUrl
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image)
      imageUrl = uploadResponse.secure_url
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    })

    await newMessage.save()

    // Check if receiver is online
    const receiverSocketId = getReceiverSocketId(receiverId)
    if (receiverSocketId) {
        // Emit newMessage event to the receiver
        io.to(receiverSocketId).emit("newMessage", newMessage);
        console.log(`Emitted newMessage to receiver ${receiverId} (socket ${receiverSocketId})`);

        // Update status to 'delivered' in DB
        try {
            await Message.findByIdAndUpdate(newMessage._id, { status: 'delivered' });
            newMessage.status = 'delivered'; // Update the object we send back/emit
            console.log(`Updated message ${newMessage._id} status to delivered in DB`);

             // Notify the sender that the message was delivered
            const senderSocketId = getSenderSocketId(senderId.toString());
            if (senderSocketId) {
                io.to(senderSocketId).emit("message-delivered", { messageId: newMessage._id, receiverId: receiverId });
                console.log(`Emitted message-delivered to sender ${senderId} (socket ${senderSocketId}) for message ${newMessage._id}`);
            } else {
                console.log(`Sender ${senderId} not connected, cannot emit message-delivered`);
            }
        } catch (dbError) {
            console.error(`Error updating message ${newMessage._id} status to delivered:`, dbError);
            // Decide how to handle this - maybe proceed without emitting 'delivered'?
        }
    } else {
        console.log(`Receiver ${receiverId} not connected, message status remains 'sent'`);
    }

    // Respond to the sender's HTTP request
    res.status(201).json(newMessage)
  } catch (error: any) {
    console.log("Error in sendMessage controller: ", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const toggleReaction = async (req: any, res: any) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Ensure userId is a string for comparison if needed, or ensure types match
    const userIdStr = userId.toString();
    const reactionIndex = message.reactions.findIndex(
      (reaction: any) => reaction.emoji === emoji && reaction.userId.toString() === userIdStr
    );

    let updatedMessage;
    if (reactionIndex > -1) {
      // User has already reacted with this emoji, remove it
      message.reactions.pull({ _id: message.reactions[reactionIndex]._id });
      updatedMessage = await message.save();
      console.log(`User ${userIdStr} removed reaction ${emoji} from message ${messageId}`);
    } else {
      // User has not reacted with this emoji, add it
      message.reactions.push({ emoji, userId });
      updatedMessage = await message.save();
      console.log(`User ${userIdStr} added reaction ${emoji} to message ${messageId}`);
    }

    // Populate user details for reactions before emitting/sending
    await updatedMessage.populate('reactions.userId', 'fullName profilePic');

    // Emit event to both sender and receiver of the original message
    const senderSocketId = getSenderSocketId(message.senderId.toString());
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());

    const reactionUpdatePayload = {
        messageId: updatedMessage._id,
        reactions: updatedMessage.reactions
    };

    if (senderSocketId) {
        io.to(senderSocketId).emit("message-reaction-update", reactionUpdatePayload);
        console.log(`Emitted message-reaction-update to sender ${message.senderId} (socket ${senderSocketId})`);
    }
    if (receiverSocketId && receiverSocketId !== senderSocketId) { // Avoid sending twice if sender is receiver
        io.to(receiverSocketId).emit("message-reaction-update", reactionUpdatePayload);
        console.log(`Emitted message-reaction-update to receiver ${message.receiverId} (socket ${receiverSocketId})`);
    }
    if (!senderSocketId && !receiverSocketId) {
        console.log(`Neither sender (${message.senderId}) nor receiver (${message.receiverId}) are connected for reaction update.`);
    }


    res.status(200).json(updatedMessage);
  } catch (error: any) {
    console.error("Error in toggleReaction controller: ", error.message);
    if (error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ error: "Invalid Message ID format" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
