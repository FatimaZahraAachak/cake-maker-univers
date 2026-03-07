import express from "express";
const app = express();
app.get("/", (req, res) => {
    res.send("Bienvenu sur Mon Gateau")
})
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
})