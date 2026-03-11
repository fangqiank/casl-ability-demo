import {drizzle} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {todos, users} from "./schema";
import {Todo} from "../ability/types";
import {User} from "../rbac/config";
import {createAbility} from "../rbac";
import {rbacConfig} from "../rbac/config";
import {DrizzleQueryAdapter} from "../rbac";
import {eq} from "drizzle-orm";
import path from "path";

// Use absolute path for database file
const dbPath = path.join(process.cwd(), "sqlite.db");

// Global singleton pattern for Next.js App Router
declare global {
  // eslint-disable-next-line no-var
  var __db_singleton__: {
    sqlite: Database.Database;
    db: ReturnType<typeof drizzle>;
  } | undefined;
}

/**
 * Get the database instance (singleton pattern)
 * This ensures only one database connection is used across all requests
 */
function getDbInternal() {
  if (!global.__db_singleton__) {
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);
    global.__db_singleton__ = { sqlite, db };
  }

  return global.__db_singleton__;
}

// Export the db directly - the singleton is maintained through global
const { db } = getDbInternal();
export { db };

// Also export getDb for internal use
export { getDbInternal as getDb };

export async function initializeDb() {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        created_at INTEGER DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        completed INTEGER DEFAULT 0,
        is_public INTEGER DEFAULT 0,
        user_id TEXT NOT NULL,
        created_at INTEGER DEFAULT CURRENT_TIMESTAMP,
        updated_at INTEGER DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // 插入测试用户
    const adminResults = db
      .select()
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .all();
    const adminExists = adminResults[0];
    if (!adminExists) {
      db.insert(users)
        .values({
          id: "1",
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        })
        .run();
    }

    const userResults = db
      .select()
      .from(users)
      .where(eq(users.email, "user@example.com"))
      .all();
    const userExists = userResults[0];
    if (!userExists) {
      db.insert(users)
        .values({
          id: "2",
          name: "Regular User",
          email: "user@example.com",
          role: "user",
        })
        .run();
    }

    console.log("Database initialized");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

export class TodoDataAccess {
  private ability: ReturnType<typeof createAbility>;
  private queryAdapter: DrizzleQueryAdapter;

  constructor(private currentUser: User | null) {
    this.ability = createAbility(currentUser, rbacConfig);
    this.queryAdapter = new DrizzleQueryAdapter(
      {todos},
      {userIdField: "userId", isPublicField: "isPublic"}
    );
  }

  private checkPermission(action: "create" | "read" | "update" | "delete" | "toggle", todo?: Todo): boolean {
    if (todo) {
      return this.ability.can(action, todo);
    }
    return this.ability.can(action, "Todo");
  }

  async findTodos(): Promise<Todo[]> {
    try {
      // 检查是否有读取权限
      if (!this.checkPermission("read")) {
        throw new Error("Forbidden: No permission to read todos");
      }

      // 使用 DrizzleQueryAdapter 获取查询条件
      const query = this.queryAdapter.getAccessibleResourcesQuery(
        this.currentUser,
        "read",
        "todos"
      );

      let result;
      if (query) {
        result = db.select().from(todos).where(query).all();
      } else {
        result = db.select().from(todos).all();
      }

      // 使用 CASL 进一步过滤
      const filtered = result.filter((todo: any): todo is Todo => {
        if (
          todo.description === null ||
          todo.completed === null ||
          todo.isPublic === null ||
          todo.createdAt === null ||
          todo.updatedAt === null
        ) {
          return false;
        }
        return this.checkPermission("read", todo as Todo);
      });

      return filtered;
    } catch (error) {
      console.error("Error finding todos:", error);
      throw new Error("Failed to fetch todos");
    }
  }

  async createTodo(
    data: Omit<Todo, "id" | "createdAt" | "updatedAt" | "userId">,
  ): Promise<Todo> {
    if (!this.checkPermission("create")) {
      throw new Error("Forbidden: No permission to create todos");
    }

    if (!this.currentUser) {
      throw new Error("Unauthorized: Must be logged in");
    }

    try {
      const id = crypto.randomUUID();
      const now = new Date();

      const todo = {
        ...data,
        id,
        userId: this.currentUser.id,
        createdAt: now,
        updatedAt: now,
      };

      db.insert(todos).values(todo).run();
      return todo as Todo;
    } catch (error) {
      console.error("Error creating todo:", error);
      throw error;
    }
  }

  async updateTodo(id: string, data: Partial<Todo>): Promise<Todo> {
    try {
      const results = db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .all();

      const existing = results[0];

      if (!existing) {
        throw new Error("Todo not found");
      }

      // 检查更新权限
      if (!this.checkPermission("update", existing as Todo)) {
        throw new Error("Forbidden: Cannot update this todo");
      }

      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date(),
      };

      db.update(todos).set(updated).where(eq(todos.id, id)).run();

      return updated as Todo;
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  }

  async deleteTodo(id: string): Promise<void> {
    try {
      const results = db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .all();

      const existing = results[0];

      if (!existing) {
        throw new Error("Todo not found");
      }

      // 检查删除权限
      if (!this.checkPermission("delete", existing as Todo)) {
        throw new Error("Forbidden: Cannot delete this todo");
      }

      db.delete(todos).where(eq(todos.id, id)).run();
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw error;
    }
  }

  async toggleTodo(id: string): Promise<Todo> {
    try {
      const results = db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .all();

      const existing = results[0];

      if (!existing) {
        throw new Error("Todo not found");
      }

      // 检查切换完成状态权限
      if (!this.checkPermission("update", existing as Todo)) {
        throw new Error("Forbidden: Cannot toggle this todo");
      }

      const updated = {
        ...existing,
        completed: !existing.completed,
        updatedAt: new Date(),
      };

      db.update(todos).set(updated).where(eq(todos.id, id)).run();

      return updated as Todo;
    } catch (error) {
      console.error("Error toggling todo:", error);
      throw error;
    }
  }
}
