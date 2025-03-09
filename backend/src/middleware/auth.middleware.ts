import jwt from "jsonwebtoken"
import User from "../models/user.model"

export const protectRoute = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies[process.env.JWT_TOKEN_NAME as string]
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string)

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" })
    }

    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Unauthorized - Invalid token" })
    }

    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - User not found" })
    }

    req.user = user
    next()
  } catch (error: any) {
    console.log("Error in protectRoute middleware", error.message)
    res.status(500).json({ message: "Internal Server Error" })
  }
}
