import express from "express";
import { db } from "./db/index";
import { users } from "./db/schema";
const app = express();
app.get("/", (req, res) => {
    res.send("Bienvenu sur Mon Gateau")
})
app.get("/users", (req, res) => {
    const allUsers = db.select().from(users).all();
    res.json(allUsers);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
})