import express from "express";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/users", authMiddleware, (req: any, res: any) => {
    const allUsers = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
    }).from(users).all();

    res.json(allUsers);
});

router.get("/users/:id", authMiddleware, (req: any, res: any) => {
    const id = Number(req.params.id);
    const user = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
    }).from(users).where(eq(users.id, id)).get();

    if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
    }
    res.json(user);
});

router.put("/users/:id", authMiddleware, (req: any, res: any) => {
    const id = Number(req.params.id);
    const { name, email } = req.body;

    const user = db.select().from(users).where(eq(users.id, id)).get();

    if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
    }

    const updatedUser = db.update(users).set({ name, email }).where(eq(users.id, id)).returning().get();
    res.json(updatedUser);
});

router.delete("/users/:id", authMiddleware, (req: any, res: any) => {
    const id = Number(req.params.id);
    const user = db.select().from(users).where(eq(users.id, id)).get();

    if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
    }

    db.delete(users).where(eq(users.id, id)).run();
    res.json({ message: "Utilisateur supprimé" });
});

router.put("/profile", authMiddleware, (req: any, res: any) => {
    const userId = req.user.id;
    const { bio, city, specialty, phone, photo } = req.body;

    const user = db.select().from(users).where(eq(users.id, userId)).get();

    if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
    }

    db.update(users).set({ bio, city, specialty, phone, photo }).where(eq(users.id, userId)).run();

    const updatedUser = db.select({
        id: users.id,
        name: users.name,
        bio: users.bio,
        city: users.city,
        specialty: users.specialty,
        phone: users.phone,
        photo: users.photo,
    }).from(users).where(eq(users.id, userId)).get();

    res.json(updatedUser);
});

router.get("/profile/:id", (req, res) => {
    const id = Number(req.params.id);

    const user = db.select({
        id: users.id,
        name: users.name,
        bio: users.bio,
        city: users.city,
        specialty: users.specialty,
        phone: users.phone,
        photo: users.photo,
    }).from(users).where(eq(users.id, id)).get();

    if (!user) {
        res.status(404).json({ error: "Profil non trouvé" });
        return;
    }

    res.json(user);
});

export default router;
