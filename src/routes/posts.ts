import express from "express";
import { db } from "../db/index";
import { posts } from "../db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";
import { z } from "zod";


const router = express.Router();
const postSchema = z.object({
    title: z.string().min(2, "Le titre doit avoir au moins 2 caractères"),
    description: z.string().min(10, "La description doit avoir au moins 10 caractères"),
    price: z.number().positive("Le prix doit être positif"),
    photo: z.string().optional(),
}).required({
    title: true,
    description: true,
    price: true,
});


router.get("/posts", (req, res) => {
    const allPosts = db.select().from(posts).all();
    res.json(allPosts);
});

router.post("/posts", authMiddleware, (req: any, res: any) => {
    const userId = req.user.id;
    const validation = postSchema.safeParse(req.body);

    if (!validation.success) {
        const issue = validation.error.issues[0];
        const message = issue.path.length > 0
            ? `Le champ "${String(issue.path[0])}" est obligatoire ou invalide`
            : issue.message;
        res.status(400).json({ error: message });


        return;
    }

    const { title, description, price, photo } = req.body;

    const newPost = db.insert(posts).values({ title, description, price, photo, userId }).returning().get();
    res.json(newPost);
});

router.put("/posts/:id", authMiddleware, (req: any, res: any) => {
    const userId = req.user.id;
    const postId = Number(req.params.id);
    const { title, description, price, photo } = req.body;

    const post = db.select().from(posts).where(eq(posts.id, postId)).get();

    if (!post) {
        res.status(404).json({ error: "Post non trouvé" });
        return;
    }

    if (post.userId !== userId) {
        res.status(403).json({ error: "Tu ne peux modifier que tes propres posts" });
        return;
    }

    const updatedPost = db.update(posts).set({ title, description, price, photo }).where(eq(posts.id, postId)).returning().get();
    res.json(updatedPost);
});

router.delete("/posts/:id", authMiddleware, (req: any, res: any) => {
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

export default router;
