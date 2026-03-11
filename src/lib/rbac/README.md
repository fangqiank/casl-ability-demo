# Universal CASL-based Permission System

一个通用的、可复用的基于 CASL 的角色权限管理系统，支持轻松集成到任何 TypeScript 项目中。

## 特性

- 🚀 **开箱即用** - 预设配置快速集成
- 🔧 **高度可配置** - 支持自定义角色、权限、继承
- 🎯 **类型安全** - 完整的 TypeScript 支持
- 🔌 **ORM 适配** - 支持 Drizzle、Prisma、Mongoose 等
- 📦 **框架无关** - 可用于 React、Next.js、Node.js 等
- 🛡️ **字段级权限** - 细粒度的字段访问控制
- 🌳 **角色继承** - 支持角色权限继承

## 安装

```bash
npm install @casl/ability
# 或
yarn add @casl/ability
# 或
pnpm add @casl/ability
```

## 快速开始

### 1. 定义用户类型

```typescript
interface User {
  id: string;
  email: string;
  role: "admin" | "user" | "guest";
}
```

### 2. 创建权限配置

#### 使用预设配置（最简单）

```typescript
import { createSimpleRBACConfig } from "@/lib/rbac";

const config = createSimpleRBACConfig<User>({
  adminCanManageAll: true,
  userCanCreatePublic: false,
  guestCanReadPublic: true,
});
```

#### 使用所有者基础配置

```typescript
import { createOwnerBasedRBACConfig } from "@/lib/rbac";

const config = createOwnerBasedRBACConfig<User>({
  adminCanManageAll: true,
  allowPublicResources: true,
});
```

#### 使用团队配置

```typescript
import { createTeamRBACConfig } from "@/lib/rbac";

const config = createTeamRBACConfig<User>({
  allowCrossTeamAccess: false,
});
```

#### 自定义配置

```typescript
import { createRBACConfig } from "@/lib/rbac";

const config = createRBACConfig<User>()
  .setDefaultRole("guest")
  .addRole("admin", {
    allow: [
      { action: "manage", subject: "all" },
    ],
  })
  .addRole("user", {
    allow: [
      { action: ["create", "read"], subject: "Todo" },
      {
        action: ["update", "delete"],
        subject: "Todo",
        conditions: { userId: "$userId" },
      },
    ],
  })
  .addRole("guest", {
    allow: [
      { action: "read", subject: "Todo", conditions: { isPublic: true } },
    ],
    forbid: [
      { action: ["create", "update", "delete"], subject: "Todo" },
    ],
  })
  .build();
```

### 3. 创建 Ability 实例

```typescript
import { createAbility } from "@/lib/rbac";

function checkPermissions(user: User | null) {
  const ability = createAbility(user, config);

  console.log("Can create?", ability.can("create", "Todo"));
  console.log("Can read?", ability.can("read", "Todo"));
  console.log("Can update?", ability.can("update", todoInstance));
  console.log("Can delete?", ability.can("delete", todoInstance));
}
```

### 4. 在 React 组件中使用

```typescript
"use client";

import { useAbility } from "@/lib/rbac";
import { useSession } from "next-auth/react";

export function PermissionButton({ todo }) {
  const { data: session } = useSession();
  const ability = useAbility(session?.user, config);

  const canDelete = ability.can("delete", todo);

  return (
    <>
      {canDelete && (
        <button onClick={() => deleteTodo(todo.id)}>
          Delete
        </button>
      )}
    </>
  );
}
```

### 5. 在 API 路由中使用

```typescript
// app/api/todos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAbility } from "@/lib/rbac";
import { TodoDataAccess } from "@/lib/db";
import { config } from "@/lib/rbac/config";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  const ability = createAbility(user, config);

  // 检查读取权限
  if (!ability.can("read", "Todo")) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const todoAccess = new TodoDataAccess(user);
  const todos = await todoAccess.findTodos();

  return NextResponse.json(todos);
}
```

## 高级用法

### 字段级权限控制

```typescript
const config = createRBACConfig<User>()
  .addRole("admin", {
    allow: [{ action: "manage", subject: "all" }],
    forbid: [
      {
        action: "update",
        subject: "Todo",
        fields: ["title", "createdAt"],
        reason: "Cannot modify title or timestamps",
      },
    ],
  })
  .build();

// 检查字段权限
const ability = createAbility(user, config);
ability.can("update", todo, "title"); // false
ability.can("update", todo, "description"); // true
```

### 条件权限

```typescript
const config = createRBACConfig<User>()
  .addRole("user", {
    allow: [
      // 只能操作自己的资源
      {
        action: ["update", "delete"],
        subject: "Todo",
        conditions: { userId: "$userId" },
      },
      // 可以读取公共资源
      {
        action: "read",
        subject: "Todo",
        conditions: { isPublic: true },
      },
    ],
  })
  .build();
```

### 角色继承

```typescript
const config = createRBACConfig<User>()
  .addInheritance("superadmin", ["admin", "moderator"])
  .addInheritance("admin", ["moderator", "user"])
  .build();
```

### 数据库查询过滤

#### Drizzle ORM

```typescript
import { DrizzleQueryAdapter } from "@/lib/rbac";
import { todos } from "@/lib/db/schema";

const adapter = new DrizzleQueryAdapter(
  { todos },
  { userIdField: "userId", isPublicField: "isPublic" }
);

const query = adapter.getAccessibleResourcesQuery(
  user,
  "read",
  "todos"
);

const todos = await db.query.todos.findMany({ where: query });
```

#### Prisma

```typescript
import { PrismaQueryAdapter } from "@/lib/rbac";

const adapter = new PrismaQueryAdapter({
  userIdField: "userId",
  isPublicField: "isPublic",
});

const query = adapter.getAccessibleResourcesQuery(user, "read", "Todo");

const todos = await prisma.todo.findMany({ where: query });
```

#### Mongoose

```typescript
import { MongooseQueryAdapter } from "@/lib/rbac";

const adapter = new MongooseQueryAdapter({
  userIdField: "userId",
  isPublicField: "isPublic",
});

const query = adapter.getAccessibleResourcesQuery(user, "read", "Todo");

const todos = await Todo.find(query);
```

## API 参考

### createAbility(user, config)

创建 CASL Ability 实例。

```typescript
const ability = createAbility(user, config);
ability.can(action, subject, field?)
```

### createPermissionChecker(ability, options?)

创建权限检查器，提供更高级的检查方法。

```typescript
const checker = createPermissionChecker(ability, {
  resourceOwnerExtractor: (resource) => resource.userId,
  queryAdapter: new DrizzleQueryAdapter(schema),
});

checker.can(action, resource, field?)
checker.isOwner(resource, userId)
checker.getAccessibleResourcesQuery(user, action, resourceType)
checker.canBatch(checks)
checker.getPermissionsForResource(resourceType)
```

### createQueryAdapter(type, schema?, config?)

创建 ORM 查询适配器。

```typescript
const adapter = createQueryAdapter(
  "drizzle", // or "prisma", "mongoose", "sql"
  schema,
  { userIdField: "userId", isPublicField: "isPublic" }
);
```

### 预设配置函数

- `createSimpleRBACConfig(options?)` - 简单三层角色
- `createOwnerBasedRBACConfig(options?)` - 基于所有者的权限
- `createTeamRBACConfig(options?)` - 团队/组织权限

## 项目结构

```
src/lib/rbac/
├── core/
│   ├── index.ts          # 核心导出
│   ├── types.ts         # 类型定义
│   ├── builder.ts       # 权限构建器
│   ├── permissions.ts   # 权限检查器
│   └── adapter.ts       # ORM 适配器
├── presets/
│   ├── index.ts         # 预设配置
│   └── examples.ts      # 使用示例
└── README.md           # 本文档
```

## 最佳实践

### 1. 权限定义集中管理

创建 `src/lib/rbac/config.ts` 集中管理权限配置：

```typescript
import { createRBACConfig } from "@/lib/rbac";

export const rbacConfig = createRBACConfig<User>()
  .setDefaultRole("guest")
  .addRole("admin", { /* ... */ })
  .addRole("user", { /* ... */ })
  .build();
```

### 2. 使用中间件保护 API

```typescript
// middleware.ts
import { createAbility } from "@/lib/rbac";
import { rbacConfig } from "@/lib/rbac/config";

export async function middleware(request: NextRequest) {
  const user = await getUser(request);
  const ability = createAbility(user, rbacConfig);

  // 检查路径权限
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && !ability.can("manage", "all")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

### 3. 组件级权限控制

```typescript
// components/PermissionGuard.tsx
import { useAbility } from "@/lib/rbac";

export function PermissionGuard({
  action,
  subject,
  field,
  fallback,
  children,
}) {
  const { data: session } = useSession();
  const ability = useAbility(session?.user, rbacConfig);

  const can =
    ability.can(action, subject as any, field);

  return can ? <>{children}</> : <>{fallback}</>;
}

// Usage
<PermissionGuard
  action="delete"
  subject={todo}
  fallback={<div>Not authorized</div>}
>
  <button>Delete</button>
</PermissionGuard>
```

### 4. 数据访问层权限控制

```typescript
class DataAccess<T> {
  constructor(
    private user: User | null,
    private ability: Ability,
    private db: any
  ) {}

  async findMany(resourceType: string) {
    if (!this.ability.can("read", resourceType)) {
      throw new ForbiddenError("read", resourceType);
    }

    const query = this.adapter.getAccessibleResourcesQuery(
      this.user,
      "read",
      resourceType
    );

    return this.db.findMany(query);
  }

  async create(resourceType: string, data: any) {
    if (!this.ability.can("create", resourceType)) {
      throw new ForbiddenError("create", resourceType);
    }

    return this.db.create({
      ...data,
      userId: this.user?.id,
    });
  }

  async update(resourceType: string, id: string, data: any) {
    const existing = await this.db.findUnique(id);
    if (!existing) {
      throw new NotFoundError(resourceType, id);
    }

    if (!this.ability.can("update", existing)) {
      throw new ForbiddenError("update", existing);
    }

    return this.db.update(id, data);
  }

  async delete(resourceType: string, id: string) {
    const existing = await this.db.findUnique(id);
    if (!existing) {
      throw new NotFoundError(resourceType, id);
    }

    if (!this.ability.can("delete", existing)) {
      throw new ForbiddenError("delete", existing);
    }

    return this.db.delete(id);
  }
}
```

## 迁移指南

### 从现有 CASL 实现迁移

如果你已经有 CASL 实现，迁移到通用系统很简单：

#### 1. 定义配置

```typescript
// 旧的权限定义
if (user.role === "admin") {
  can("manage", "all");
} else if (user.role === "user") {
  can("read", "Todo", {userId: user.id});
  can("update", "Todo", {userId: user.id});
}

// 新的配置方式
const config = createRBACConfig<User>()
  .addRole("admin", {
    allow: [{ action: "manage", subject: "all" }],
  })
  .addRole("user", {
    allow: [
      {
        action: ["read", "update", "delete"],
        subject: "Todo",
        conditions: { userId: "$userId" },
      },
    ],
  })
  .build();
```

#### 2. 替换 Ability 创建

```typescript
// 旧方式
const builder = new TodoAbilityBuilder(user);
const ability = builder.getAbility();

// 新方式
const ability = createAbility(user, config);
```

## License

MIT
