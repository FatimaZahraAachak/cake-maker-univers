import express from "express";
import { db } from "./db/index";
import { users, profiles } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";



const app = express();
app.use(express.json());
const JWT_SECRET = process.env.JWT_SECRET!;
function authMiddleware(req: any, res: any, next: any) {
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

app.get("/", authMiddleware, (req, res) => {
    res.send("Bienvenu sur Mon Gateau")
})
app.get("/users", authMiddleware, (req: any, res: any) => {
    const allUsers = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
    }).from(users).all();

    res.json(allUsers);
});

app.get("/users/:id", authMiddleware, (req: any, res: any) => {
    const id = Number(req.params.id);
    const user = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
    }).from(users).where(eq(users.id, id)).get();

    if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
    }
    res.json(user);
});
app.put("/users/:id", authMiddleware, (req: any, res: any) => {
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
app.delete("/users/:id", authMiddleware, (req: any, res: any) => {
    const id = Number(req.params.id);
    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) {
        res.status(404).json({ error: "utilisateur non trouvé" });
        return;
    }
    db.delete(users).where(eq(users.id, id)).run();
    res.json({ message: "utilisateur supprimé" })
})
app.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    const existingUser = db.select().from(users).where(eq(users.email, email)).get();

    if (existingUser) {
        res.status(400).json({ error: "Cet email existe déjà" });
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = db.insert(users).values({ name, email, password: hashedPassword, role }).returning().get();

    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET);

    res.json({ token });
});
app.post("/login", async (req, res) => {
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

app.post("/profile", authMiddleware, async (req: any, res: any) => {
    const { bio, city, specialty, photo } = req.body;
    const userId = req.user.id;

    const existingProfile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();

    if (existingProfile) {
        res.status(400).json({ error: "Tu as déjà un profil" });
        return;
    }

    const newProfile = db.insert(profiles).values({ userId, bio, city, specialty, photo }).returning().get();
    res.json(newProfile);
});
app.put("/profile", authMiddleware, (req: any, res: any) => {
    const userId = req.user.id;
    const { bio, city, specialty, photo } = req.body;

    const existingProfile = db.select().from(profiles).where(eq(profiles.userId, userId)).get();

    if (!existingProfile) {
        res.status(404).json({ error: "tu n'as pas encore de profil" });
        return;
    }

    const updatedProfile = db.update(profiles).set({ bio, city, specialty, photo }).where(eq(profiles.userId, userId)).returning().get();
    res.json(updatedProfile);
});
app.get("/profile/:id", (req: any, res: any) => {
    const userId = Number(req.params.id);
    const profil = db.select().from(profiles).where(eq(profiles.userId, userId)).get();

    if (!profil) {
        res.status(404).json({ error: "Profil non trouvé" });
        return;
    }
    res.json(profil);
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
})