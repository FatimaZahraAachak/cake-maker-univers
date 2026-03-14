import express from "express";
import { db } from "./db/index";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const app = express();
app.use(express.json());
const JWT_SECRET = "mon-gateau-secret-key";
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

app.get("/", authMiddleware,(req, res) => {
    res.send("Bienvenu sur Mon Gateau")
})
app.get("/users", authMiddleware, (req, res) => {
    const allUsers = db.select().from(users).all();
    res.json(allUsers);
});

app.get("/users/:id", authMiddleware, (req, res) => {
    const id = Number(req.params.id);
    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
    }
    res.json(user);
});
app.put("/users/:id", authMiddleware, (req, res) => {
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
app.delete("/users/:id", authMiddleware, (req, res) => {
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
    const { name, email, password } = req.body;

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
})