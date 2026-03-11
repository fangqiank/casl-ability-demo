/**
 * Migration Example: Migrating Todo App to Universal RBAC
 *
 * This shows how to migrate the current Todo app to use the new universal permission system
 */

import { createAbility, createRBACConfig, createSimpleRBACConfig } from "@/lib/rbac";

// ============================================
// STEP 1: Keep your existing User interface (or extend BaseUser)
// ============================================

interface User {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
}

type UserRole = "admin" | "user" | "guest";

// ============================================
// STEP 2: Create the RBAC configuration (migrated from old builder)
// ============================================

// Option A: Use preset configuration (RECOMMENDED)
const todoRBACConfig = createSimpleRBACConfig<User>({
  adminCanManageAll: true,
  userCanCreatePublic: false,
  guestCanReadPublic: true,
});

// Option B: Custom configuration (if you have custom requirements)
const customTodoRBACConfig = createRBACConfig<User>()
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
      {
        action: "read",
        subject: "Todo",
        conditions: {
          $or: [{ isPublic: true }, { userId: "$userId" }],
        },
      },
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
        reason: "Cannot modify public todos of others",
      },
      {
        action: "delete",
        subject: "Todo",
        conditions: { userId: { $ne: "$userId" } },
        reason: "Cannot delete todos of others",
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

// Export the configuration to use in your app
export const rbacConfig = customTodoRBACConfig;

// ============================================
// STEP 3: Replace TodoAbilityBuilder with createAbility
// ============================================

// OLD CODE (src/lib/ability/builder.ts):
/*
export class TodoAbilityBuilder {
  constructor(private user: User | null) {
    this.ability = this.buildAbility();
  }

  getAbility(): AppAbility {
    return this.ability;
  }
}
*/

// NEW CODE - Simple wrapper for backward compatibility:
export class TodoAbilityBuilder {
  private ability: ReturnType<typeof createAbility<User>>;

  constructor(user: User | null) {
    this.ability = createAbility(user, rbacConfig);
  }

  getAbility() {
    return this.ability;
  }

  can(action: string, subject: any, field?: string): boolean {
    return this.ability.can(action, subject, field);
  }
}

// ============================================
// STEP 4: Update PermissionAdapter (if you use one)
// ============================================

// import { DrizzleQueryAdapter } from "@/lib/rbac";
// import { todos } from "@/lib/db/schema";

/*
export class PermissionAdapter {
  static getAccessibleTodosQuery = (user: User | null) => {
    const adapter = new DrizzleQueryAdapter(
      { todos },
      { userIdField: "userId", isPublicField: "isPublic" }
    );

    return adapter.getAccessibleResourcesQuery(user, "read", "todos");
  };

  static canAccessTodo = (user: User | null, todo: any) => {
    const ability = createAbility(user, rbacConfig);
    return ability.can("read", todo);
  };
}
*/

// ============================================
// STEP 5: Update Data Access Layer
// ============================================

/*
export class TodoDataAccess {
  private ability: ReturnType<typeof createAbility<User>>;
  private queryAdapter: DrizzleQueryAdapter;

  constructor(private user: User | null) {
    this.ability = createAbility(user, rbacConfig);
    this.queryAdapter = new DrizzleQueryAdapter(
      { todos },
      { userIdField: "userId", isPublicField: "isPublic" }
    );
  }

  async findTodos() {
    // Check if user can read todos
    if (!this.ability.can("read", "Todo")) {
      throw new Error("Forbidden: No permission to read todos");
    }

    // Get query filter based on permissions
    const query = this.queryAdapter.getAccessibleResourcesQuery(
      this.user,
      "read",
      "todos"
    );

    // Execute query
    const result = query
      ? await db.select().from(todos).where(query).all()
      : await db.select().from(todos).all();

    // Client-side filtering (for complex conditions)
    return result.filter((todo: any) => this.ability.can("read", todo));
  }

  async createTodo(data: any) {
    if (!this.ability.can("create", "Todo")) {
      throw new Error("Forbidden: No permission to create todos");
    }

    if (!this.user) {
      throw new Error("Unauthorized: Must be logged in");
    }

    const todo = {
      ...data,
      id: crypto.randomUUID(),
      userId: this.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(todos).values(todo).run();
    return todo;
  }

  async updateTodo(id: string, data: any) {
    const existing = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .get();

    if (!existing) {
      throw new Error("Todo not found");
    }

    if (!this.ability.can("update", existing)) {
      throw new Error("Forbidden: Cannot update this todo");
    }

    await db.update(todos).set(data).where(eq(todos.id, id)).run();
    return { ...existing, ...data, updatedAt: new Date() };
  }

  async deleteTodo(id: string) {
    const existing = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .get();

    if (!existing) {
      throw new Error("Todo not found");
    }

    if (!this.ability.can("delete", existing)) {
      throw new Error("Forbidden: Cannot delete this todo");
    }

    await db.delete(todos).where(eq(todos.id, id)).run();
  }

  async toggleTodo(id: string) {
    const existing = await db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .get();

    if (!existing) {
      throw new Error("Todo not found");
    }

    if (!this.ability.can("update", existing)) {
      throw new Error("Forbidden: Cannot toggle this todo");
    }

    const updated = {
      ...existing,
      completed: !existing.completed,
      updatedAt: new Date(),
    };

    await db.update(todos).set(updated).where(eq(todos.id, id)).run();
    return updated;
  }
}
*/

// ============================================
// STEP 6: Update API Routes (if you use them)
// ============================================

// app/api/todos/route.ts
// import { rbacConfig } from "@/lib/rbac/config";
// import { TodoDataAccess } from "@/lib/db";
// import { getCurrentUser } from "@/lib/auth";

/*
export async function GET() {
  const user = await getCurrentUser();
  const ability = createAbility(user, rbacConfig);

  if (!ability.can("read", "Todo")) {
    return NextResponse.json(
      { error: "Forbidden: No permission to read todos" },
      { status: 403 }
    );
  }

  const todoAccess = new TodoDataAccess(user);
  const todos = await todoAccess.findTodos();

  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const ability = createAbility(user, rbacConfig);

  if (!ability.can("create", "Todo")) {
    return NextResponse.json(
      { error: "Forbidden: No permission to create todos" },
      { status: 403 }
    );
  }

  // ... rest of the code
}
*/

// ============================================
// STEP 7: Update Client Components
// ============================================

// components/PermissionGuard.tsx
// "use client";

// import { ReactNode } from "react";
// import { useSession } from "next-auth/react";
// import { rbacConfig } from "@/lib/rbac/config";

/*
interface PermissionGuardProps {
  children: ReactNode;
  action: string;
  subject?: any;
  todo?: any;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  action,
  subject,
  todo,
  fallback = null,
}: PermissionGuardProps) {
  const { data: session } = useSession();
  const user = session?.user || null;
  const ability = createAbility(user, rbacConfig);

  let hasPermission = false;

  if (todo) {
    hasPermission = ability.can(action, todo);
  } else if (subject) {
    hasPermission = ability.can(action, subject);
  } else {
    hasPermission = ability.can(action, "all");
  }

  return <>{hasPermission ? children : fallback}</>;
}

// Usage in components:
// <PermissionGuard action="create">
//   <button>Create Todo</button>
// </PermissionGuard>
//
// <PermissionGuard action="delete" todo={todo}>
//   <button>Delete</button>
// </PermissionGuard>
*/

// ============================================
// Bonus: Create a custom hook for easier usage
// ============================================

// import { useMemo } from "react";
// import { useSession } from "next-auth/react";
// import { createPermissionChecker } from "@/lib/rbac";
// import { DrizzleQueryAdapter } from "@/lib/rbac";
// import { rbacConfig } from "@/lib/rbac/config";
// import { todos } from "@/lib/db/schema";

/*
export function useTodoPermissions() {
  const { data: session } = useSession();
  const user = session?.user || null;

  const ability = useMemo(() => createAbility(user, rbacConfig), [user]);

  const checker = useMemo(
    () =>
      createPermissionChecker(ability, {
        resourceOwnerExtractor: (resource: any) => resource.userId,
        queryAdapter: new DrizzleQueryAdapter(
          { todos },
          { userIdField: "userId", isPublicField: "isPublic" }
        ),
      }),
    [ability]
  );

  return {
    canCreate: () => checker.can("create", "Todo"),
    canRead: (todo: any) => checker.can("read", todo),
    canUpdate: (todo: any) => checker.can("update", todo),
    canDelete: (todo: any) => checker.can("delete", todo),
    canToggle: (todo: any) => checker.can("update", todo),
    isOwner: (todo: any) => checker.isOwner(todo, user?.id),
    getAccessibleQuery: () =>
      checker.getAccessibleResourcesQuery(user, "read", "todos"),
  };
}
*/

// Usage in component:
// function TodoItem({ todo }) {
//   const { canUpdate, canDelete, canToggle } = useTodoPermissions();
//
//   return (
//     <div>
//       <button onClick={() => toggleTodo(todo.id)} disabled={!canToggle(todo)}>
//         Toggle
//       </button>
//       {canUpdate(todo) && <button onClick={() => editTodo(todo)}>Edit</button>}
//       {canDelete(todo) && <button onClick={() => deleteTodo(todo.id)}>Delete</button>}
//     </div>
//   );
// }

// ============================================
// Summary of Changes
// ============================================

/*
MIGRATION CHECKLIST:

✅ 1. Install universal RBAC system
   - Copy /src/lib/rbac/ to your project

✅ 2. Update configuration
   - Replace old builder with createRBACConfig
   - Or use preset configurations

✅ 3. Update Ability creation
   - Replace new TodoAbilityBuilder(user) with createAbility(user, config)

✅ 4. Update data access layer
   - Use DrizzleQueryAdapter for query filtering
   - Add permission checks before operations

✅ 5. Update API routes
   - Use createAbility for permission checks
   - Return proper error codes

✅ 6. Update components
   - Use PermissionGuard or custom hooks
   - Simplify permission logic

BENEFITS:

✅ Reusable across projects
✅ Consistent API
✅ Better type safety
✅ Multiple ORM support
✅ Preset configurations for common patterns
✅ Easier testing and maintenance

*/
