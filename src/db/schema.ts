import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    role: text("role").notNull(),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
export const profiles = sqliteTable("profiles", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id").notNull().references(() => users.id),
    bio: text("bio").notNull(),
    city: text("city").notNull(),
    specialty: text("specialty").notNull(),
    photo: text("photo"),
    createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
