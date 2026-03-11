import {sql} from "drizzle-orm";
import {sqliteTable, text, integer} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", {enum: ["admin", "user", "guest"]}).notNull().default("user"),
  createdAt: integer("created_at", {mode: "timestamp"}).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});

export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  completed: integer("completed", {mode: "boolean"}).default(false),
  isPublic: integer("is_public", {mode: "boolean"}).default(false),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", {mode: "timestamp"}).default(
    sql`CURRENT_TIMESTAMP`,
  ),
  updatedAt: integer("updated_at", {mode: "timestamp"}).default(
    sql`CURRENT_TIMESTAMP`,
  ),
});
