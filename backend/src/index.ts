import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import path from "path"
import { connectDB } from "./lib/db"
import { app, server } from "./lib/socket"

import authRoutes from "./routes/auth.route"
import messageRoutes from "./routes/message.route"
import userRoutes from "./routes/user.route"

dotenv.config()

const PORT = process.env.PORT || 5000

app.use(express.json({ limit: "5mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cookieParser())
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
)

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/users", userRoutes)

if (process.env.NODE_ENV !== "development") {
  const frontendBuildPath = path.resolve(__dirname, "../../frontend/dist")

  console.log("Looking for frontend build at:", frontendBuildPath)

  app.use(express.static(frontendBuildPath))
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendBuildPath, "index.html"))
  })
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT)
  connectDB()
})
