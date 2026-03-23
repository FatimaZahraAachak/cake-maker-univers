import express from "express";
import "dotenv/config";
import authenticationRouter from "./routes/authentification";
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";

const app = express();
app.use(express.json());

app.use(authenticationRouter);
app.use(usersRouter);
app.use(postsRouter);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
