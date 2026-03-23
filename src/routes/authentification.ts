import express from "express";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { z } from "zod";


const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const registerSchema = z.object({
    name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
    email: z.string().includes("@", { message: "Email invalide" }),
    password: z.string().min(6, "Le mot de passe doit avoir au moins 6 caractères"),
});

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        res.status(400).json({ error: validation.error.issues[0].message });

        return;
    }

    const existingUser = db.select().from(users).where(eq(users.email, email)).get();

    if (existingUser) {
        res.status(400).json({ error: "Cet email existe déjà" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = db.insert(users).values({ name, email, password: hashedPassword }).returning().get();
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);

    res.json({ token });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token });
});

export default router;
