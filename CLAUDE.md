# CASL Ability 通用权限系统

## 项目概述

本项目实现了一个基于 CASL 的通用角色权限管理系统（RBAC），支持轻松复用到其他项目。

## 技术栈

- **框架**: Next.js 16, React 19
- **认证**: NextAuth.js
- **权限**: CASL Ability
- **数据库**: Drizzle ORM + better-sqlite3
- **样式**: Tailwind CSS 4
- **语言**: TypeScript

## 通用权限系统

### 目录结构

```
src/lib/rbac/
├── core/                    # 核心功能模块
│   ├── index.ts            # 核心导出
│   ├── types.ts            # 通用类型定义
│   ├── builder.ts          # 权限构建器
│   ├── permissions.ts      # 权限检查器
│   └── adapter.ts          # ORM 适配器
├── presets/                # 预设配置
│   ├── index.ts            # 预设配置函数
│   └── examples.ts         # 使用示例
├── examples/               # 迁移和使用示例
│   └── migration.ts        # 从旧系统迁移指南
├── index.ts                # 主入口
└── README.md              # 详细文档
```

### 核心API

#### 1. 创建Ability

```typescript
import { createAbility } from "@/lib/rbac";

const ability = createAbility(user, config);
ability.can("create", "Todo");
ability.can("update", todo, "title");  // 字段级权限
```

#### 2. 预设配置

```typescript
import { createSimpleRBACConfig } from "@/lib/rbac";

const config = createSimpleRBACConfig<User>({
  adminCanManageAll: true,
  userCanCreatePublic: false,
  guestCanReadPublic: true,
});
```

其他预设：
- `createOwnerBasedRBACConfig()` - 基于所有者的权限
- `createTeamRBACConfig()` - 团队权限
- `createRBACConfig()` - 自定义配置

#### 3. ORM适配器

```typescript
import { DrizzleQueryAdapter } from "@/lib/rbac";

const adapter = new DrizzleQueryAdapter(
  { todos },
  { userIdField: "userId", isPublicField: "isPublic" }
);

const query = adapter.getAccessibleResourcesQuery(user, "read", "todos");
```

支持的ORM:
- Drizzle ORM
- Prisma
- Mongoose
- SQL (Knex/Sequelize/Kysely)

### 项目特定配置

本项目的Todo权限配置位于 `src/lib/rbac/config.ts` (需要创建):

```typescript
import { createRBACConfig } from "@/lib/rbac";

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
      {
        action: "read",
        subject: "Todo",
        conditions: { $or: [{ isPublic: true }, { userId: "$userId" }] },
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
      },
      { action: "delete", subject: "Todo", conditions: { userId: { $ne: "$userId" } } },
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
```

### 数据库Schema

- **users表**: 存储用户信息
- **todos表**: 存储待办事项

### Demo账户

- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

### 已修复的问题

1. ✅ 类型安全 - 移除 `any` 类型，使用 `unknown`
2. ✅ Middleware迁移 - 从 `middleware.ts` 迁移到 `proxy.ts` (Next.js 16)
3. ✅ Tailwind CSS 4 - 更新语法 `bg-linear-to-r` 替代 `bg-gradient-to-r`
4. ✅ CSS模块类型 - 添加 css.d.ts 类型声明
5. ✅ 数据库初始化 - 在auth路由初始化数据库
6. ✅ 登录功能 - 修复secret配置问题

### 环境变量

虽然提供了fallback secret用于开发，但生产环境建议设置:

```bash
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

### Git仓库

https://github.com/fangqiank/casl-ability-demo
