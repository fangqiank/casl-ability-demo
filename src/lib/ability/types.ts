import {MongoAbility, MongoQuery} from "@casl/ability";

// 定义 MongoDB 风格的条件类型
export type Conditions = MongoQuery<{
  isPublic?: boolean;
  userId?: string | {$ne: string};
  completed?: boolean;
  createdAt?: {$lt: Date} | {$gt: Date} | {$lte: Date} | {$gte: Date};
}>;

export type UserRole = "admin" | "user" | "guest";

export interface User {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 定义 CASL 的动作类型
export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "toggle";

// 定义 CASL 的主题类型 - 包含字符串字面量和对象类型
export type PermissionSubject = "Todo" | "User" | "all" | Todo;

// Todo 的查询条件类型
export interface TodoConditions {
  isPublic?: boolean;
  userId?: string | {$ne: string};
  completed?: boolean;
  createdAt?: {$lt: Date} | {$gt: Date} | {$lte: Date} | {$gte: Date};
}

// 定义 Ability 类型
export type AppAbility = MongoAbility<
  [PermissionAction, PermissionSubject],
  Conditions
>;

export interface PermissionRule {
  action: PermissionAction | PermissionAction[];
  subject: PermissionSubject;
  conditions?: TodoConditions;
  fields?: string[];
}

export interface Permission {
  allow: PermissionRule[];
  forbid: PermissionRule[];
}

export interface PermissionFunctions {
  canCreateTodo: (userId: string) => boolean;
  canReadTodo: (userId: string, todo: Todo) => boolean;
  canUpdateTodo: (userId: string, todo: Todo) => boolean;
  canDeleteTodo: (userId: string, todo: Todo) => boolean;
  canToggleTodo: (userId: string, todo: Todo) => boolean;
}
