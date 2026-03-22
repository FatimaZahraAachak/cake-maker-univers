import express from "express";
import { db } from "./db/index";
import { posts, users } from "./db/schema";
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
app.put("/profile", authMiddleware, (req: any, res: any) => {
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
app.get("/profile/:id", (req, res) => {
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

app.post("/posts", authMiddleware, (req: any, res: any) => {
    const userId = req.user.id;
    const { title, description, price, photo } = req.body;

    const newPost = db.insert(posts).values({ title, description, price, photo, userId }).returning().get();
    res.json(newPost);
});
app.get("/posts", (req, res) => {
    const allPosts = db.select().from(posts).all();
    res.json(allPosts);
});
app.delete("/posts/:id", authMiddleware, (req: any, res: any) => {
    const userId = req.user.id;
    const postId = Number(req.params.id);

    const post = db.select().from(posts).where(eq(posts.id, postId)).get();

    if (!post) {
        res.status(404).json({ error: "Post non trouvé" });
        return;
    }

    if (post.userId !== userId) {
        res.status(403).json({ error: "Tu ne peux supprimer que tes propres posts" });
        return;
    }

    db.delete(posts).where(eq(posts.id, postId)).run();
    res.json({ message: "Post supprimé" });
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
})