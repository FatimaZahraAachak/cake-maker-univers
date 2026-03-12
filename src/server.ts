import express from "express";
import { db } from "./db/index";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Bienvenu sur Mon Gateau")
})
app.get("/users", (req, res) => {
    const allUsers = db.select().from(users).all();
    res.json(allUsers);
});

app.get("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) {
        res.status(404).json({ error: "Utilisateur non trouvé" });
        return;
    }
    res.json(user);
});
app.put("/users/:id", (req, res) => {
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
app.delete("/users/:id", (req, res) => {
    const id = Number(req.params.id);
    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) {
        res.status(404).json({ error: "utilisateur non trouvé" });
        return;
    }
    db.delete(users).where(eq(users.id, id)).run();
    res.json({ message: "utilisateur supprimé" })
})
app.post("/users", (req, res) => {
    const { name, email } = req.body;
    const newUser = db.insert(users).values({ name, email }).returning().get();
    res.json(newUser);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
})