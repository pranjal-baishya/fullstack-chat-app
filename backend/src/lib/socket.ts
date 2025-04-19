import { Server } from "socket.io"
import http from "http"
import express from "express"
import User from "../models/user.model"
import Message from "../models/message.model"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true, // Allow cookies
  },
})

// used to store online users
const userSocketMap: { [key: string]: string } = {} // {userId: socketId}

export function getReceiverSocketId(userId: string) {
  return userSocketMap[userId]
}

// Helper function to get sender's socket ID (if connected)
export function getSenderSocketId(userId: string) {
  return userSocketMap[userId]
}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id)

  const userId = socket.handshake.query.userId as string | undefined

  if (userId) {
    userSocketMap[userId] = socket.id

    // Update lastSeen on connect
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() })
      console.log(`Updated lastSeen for user ${userId} on connect`)
    } catch (error) {
      console.error(
        `Error updating lastSeen for user ${userId} on connect:`,
        error
      )
    }

    // io.emit() is used to send events to all the connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))
  } else {
    console.warn("Connection attempt without userId in handshake query.")
    // Optionally disconnect if userId is mandatory
    // socket.disconnect(true);
    // return;
  }

  // Listener for marking messages as read
  socket.on("mark-messages-as-read", async ({ conversationPartnerId }) => {
    if (!userId) {
      console.error(
        "Cannot mark messages as read: userId is missing for this socket."
      )
      return
    }
    console.log(
      `Received mark-messages-as-read from ${userId} for conversation with ${conversationPartnerId}`
    )
    try {
      // Update messages in the database
      const result = await Message.updateMany(
        {
          senderId: conversationPartnerId, // Messages sent BY the partner
          receiverId: userId, // Messages sent TO me
          status: { $ne: "read" }, // Only update if not already read
        },
        { $set: { status: "read" } }
      )

      console.log(
        `Updated ${result.modifiedCount} messages to 'read' for conversation between ${userId} and ${conversationPartnerId}`
      )

      // Notify the sender (conversation partner) that messages were read
      const senderSocketId = getReceiverSocketId(conversationPartnerId)
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages-read", { readerId: userId })
        console.log(
          `Emitted 'messages-read' event to ${conversationPartnerId} (socket ${senderSocketId})`
        )
      } else {
        console.log(
          `Could not emit 'messages-read' event: sender ${conversationPartnerId} is not connected.`
        )
      }
    } catch (error) {
      console.error(
        `Error marking messages as read for user ${userId} and partner ${conversationPartnerId}:`,
        error
      )
    }
  })

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id)
    if (userId) {
      // Update lastSeen on disconnect
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() })
        console.log(`Updated lastSeen for user ${userId} on disconnect`)
      } catch (error) {
        console.error(
          `Error updating lastSeen for user ${userId} on disconnect:`,
          error
        )
      }

      delete userSocketMap[userId]
      console.log(`Removed user ${userId} from userSocketMap`)
      io.emit("getOnlineUsers", Object.keys(userSocketMap))
    } else {
      console.warn("Disconnect event for a socket without a userId mapping.")
    }
  })
})

export { io, app, server }
