import { createRBACConfig } from "@/lib/rbac";

// Export UserRole for use in other parts of the application
export type UserRole = "admin" | "user" | "guest";

export interface User {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
}

export const rbacConfig = createRBACConfig<User>()
  .setDefaultRole("guest")
  .addRole("admin", {
    allow: [{ action: "manage", subject: "all" }],
    forbid: [
      {
        action: "update",
        subject: "Todo",
        fields: ["title"],
        reason: "管理员不能修改待办事项标题",
      },
    ],
  })
  .addRole("user", {
    allow: [
      { action: "create", subject: "Todo" },
      // Split read permission: can read own todos OR public todos
      { action: "read", subject: "Todo", conditions: { isPublic: true } },
      { action: "read", subject: "Todo", conditions: { userId: "$userId" } },
      {
        action: ["update", "delete", "toggle"],
        subject: "Todo",
        conditions: { userId: "$userId" },
      },
    ],
    forbid: [
      {
        action: "update",
        subject: "Todo",
        conditions: { isPublic: true, userId: { $ne: "$userId" } },
        reason: "不能修改其他人的公共待办事项",
      },
      {
        action: "delete",
        subject: "Todo",
        conditions: { userId: { $ne: "$userId" } },
        reason: "不能删除其他人的待办事项",
      },
    ],
  })
  .addRole("guest", {
    allow: [{ action: "read", subject: "Todo", conditions: { isPublic: true } }],
    forbid: [
      { action: "create", subject: "Todo" },
      { action: "update", subject: "Todo" },
      { action: "delete", subject: "Todo" },
      { action: "toggle", subject: "Todo" },
    ],
  })
  .build();
