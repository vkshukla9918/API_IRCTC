import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authenticateAdmin = (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(403).json({ msg: "Forbidden" });
    }
    next();
};

// Middleware for JWT authentication (Logged-in users)
export const authenticateUser = (req, res, next) => {
    if (!req.header("Authorization")) {
        return res.status(401).json({ msg: "Unauthorized" });
    }
    const [startsWith, token] = req.header("Authorization").split(" ");
    if (startsWith !== "Bearer") return res.status(401).json({ msg: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Unauthorized" });
    }
};
