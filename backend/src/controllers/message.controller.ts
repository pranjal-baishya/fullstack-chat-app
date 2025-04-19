import User from "../models/user.model"
import Message from "../models/message.model"
import cloudinary from "../lib/cloudinary"
import { io, getReceiverSocketId, getSenderSocketId } from "../lib/socket"

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
    const { id: userToChatId } = req.params
    const myId = req.user._id

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })

    res.status(200).json(messages)
  } catch (error: any) {
    console.log("Error in getMessages controller: ", error.message)
    res.status(500).json({ error: "Internal server error" })
  }
}

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
