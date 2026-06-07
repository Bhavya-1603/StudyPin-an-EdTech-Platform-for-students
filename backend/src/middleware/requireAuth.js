import admin from "../config/firebaseAdmin.js"

export const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const token = header.split(" ")[1]

    const decoded = await admin.auth().verifyIdToken(token)

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || null
    }

    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" })
  }
}