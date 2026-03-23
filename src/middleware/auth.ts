import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET!;

export function authMiddleware(req: any, res: any, next: any) {
    const header = req.headers.authorization;

    if (!header) {
        res.status(401).json({ error: "Token manquant" });
        return;
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Token invalide" });
    }
}
