import {eq, or} from "drizzle-orm";
import {User, Todo} from "./types";
import {todos} from "../db/schema";

export class PermissionAdapter {
  static getAccessibleTodosQuery(user: User | null) {
    if (!user)
      // 游客只能看公共待办
      return eq(todos.isPublic, true);

    if (user.role === "admin")
      // 管理员看所有
      return undefined;

    // 普通用户看自己的和公共的
    return or(eq(todos.isPublic, true), eq(todos.userId, user.id));
  }

  static canAccessTodo(user: User | null, todo: Todo): boolean {
    if (!user) return todo.isPublic === true;

    if (user.role === "admin") return true;

    return todo.isPublic === true || todo.userId === user.id;
  }
}
