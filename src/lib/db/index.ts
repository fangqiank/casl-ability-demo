import {drizzle} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {todos, users} from "./schema";
import {User, Todo, PermissionAction} from "../ability/types";
import {TodoAbilityBuilder} from "../ability/builder";
import {PermissionAdapter} from "../ability/adapter";
import {eq} from "drizzle-orm";

const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite);

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
    const adminExists = db
      .select()
      .from(users)
      .where(eq(users.email, "admin@example.com"))
      .get();
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

    const userExists = db
      .select()
      .from(users)
      .where(eq(users.email, "user@example.com"))
      .get();
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
  private abilityBuilder: TodoAbilityBuilder;
  private ability: ReturnType<TodoAbilityBuilder["getAbility"]>;

  constructor(private currentUser: User | null) {
    this.abilityBuilder = new TodoAbilityBuilder(currentUser);
    this.ability = this.abilityBuilder.getAbility();
  }

  private checkPermission(action: PermissionAction, todo?: Todo): boolean {
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

      const query = PermissionAdapter.getAccessibleTodosQuery(this.currentUser);

      let result;
      if (query) {
        result = await db.select().from(todos).where(query).all();
      } else {
        result = await db.select().from(todos).all();
      }

      // 使用 CASL 进一步过滤
      return result.filter((todo): todo is Todo => {
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
      }) as Todo[];
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

      await db.insert(todos).values(todo).run();
      return todo as Todo;
    } catch (error) {
      console.error("Error creating todo:", error);
      throw error;
    }
  }

  async updateTodo(id: string, data: Partial<Todo>): Promise<Todo> {
    try {
      const existing = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .get();

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

      // 检查更新后的实体是否符合权限
      if (!this.checkPermission("update", updated as Todo)) {
        throw new Error("Forbidden: Updated todo violates permissions");
      }

      await db.update(todos).set(updated).where(eq(todos.id, id)).run();

      return updated as Todo;
    } catch (error) {
      console.error("Error updating todo:", error);
      throw error;
    }
  }

  async deleteTodo(id: string): Promise<void> {
    try {
      const existing = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .get();

      if (!existing) {
        throw new Error("Todo not found");
      }

      // 检查删除权限
      if (!this.checkPermission("delete", existing as Todo)) {
        throw new Error("Forbidden: Cannot delete this todo");
      }

      await db.delete(todos).where(eq(todos.id, id)).run();
    } catch (error) {
      console.error("Error deleting todo:", error);
      throw error;
    }
  }

  async toggleTodo(id: string): Promise<Todo> {
    try {
      const existing = await db
        .select()
        .from(todos)
        .where(eq(todos.id, id))
        .get();

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

      await db.update(todos).set(updated).where(eq(todos.id, id)).run();

      return updated as Todo;
    } catch (error) {
      console.error("Error toggling todo:", error);
      throw error;
    }
  }
}
