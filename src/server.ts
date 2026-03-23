import express from "express";
import "dotenv/config";
import authenticationRouter from "./routes/authentification";
import usersRouter from "./routes/users";
import postsRouter from "./routes/posts";
import cors from "cors";


const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(authenticationRouter);
app.use(usersRouter);
app.use(postsRouter);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
