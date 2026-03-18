import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    bio: text("bio"),
    city: text("city"),
    specialty: text("specialty"),
    phone: text("phone"),
    photo: text("photo"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
export const posts = sqliteTable("posts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: integer("price").notNull(),
    photo: text("photo"),
    userId: integer("user_id").notNull().references(() => users.id),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

