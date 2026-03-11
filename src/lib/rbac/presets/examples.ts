/**
 * Universal RBAC System - Usage Examples
 *
 * This file demonstrates how to use the universal permission system
 * in different scenarios
 */

import {
  createAbility,
  createPermissionChecker,
  createRBACConfig,
  createSimpleRBACConfig,
  createOwnerBasedRBACConfig,
  createTeamRBACConfig,
  createQueryAdapter,
  DrizzleQueryAdapter,
} from "../index";

// ============================================
// Example 1: Simple Todo App (like current project)
// ============================================

interface TodoUser {
  id: string;
  email: string;
  role: "admin" | "user" | "guest";
}

// Using preset configuration
const todoConfig = createSimpleRBACConfig<TodoUser>({
  adminCanManageAll: true,
  userCanCreatePublic: false,
  guestCanReadPublic: true,
});

// Check permissions
function checkTodoPermissions(user: TodoUser | null) {
  const ability = createAbility(user, todoConfig);

  console.log("Can create todos?", ability.can("create", "Todo"));
  console.log("Can read todos?", ability.can("read", "Todo"));
  console.log("Can update todos?", ability.can("update", "Todo"));
  console.log("Can delete todos?", ability.can("delete", "Todo"));
}

// ============================================
// Example 2: Blog with Owner-Based Permissions
// ============================================

interface BlogUser {
  id: string;
  username: string;
  role: "admin" | "author" | "subscriber";
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPublished: boolean;
}

// Using owner-based configuration
const blogConfig = createOwnerBasedRBACConfig<BlogUser>({
  adminCanManageAll: true,
  allowPublicResources: true,
});

function checkBlogPermissions(user: BlogUser | null, post: BlogPost) {
  const ability = createAbility(user, blogConfig);

  console.log("Can read post?", ability.can("read", post));
  console.log("Can update post?", ability.can("update", post));
  console.log("Can delete post?", ability.can("delete", post));

  // With query adapter
  const adapter = new DrizzleQueryAdapter({
    userIdField: "authorId",
    isPublicField: "isPublished",
  });

  const query = adapter.getAccessibleResourcesQuery(user, "read", "posts");
  console.log("Accessible posts query:", query);
}

// ============================================
// Example 3: Custom Configuration with Builder
// ============================================

interface EcommerceUser {
  id: string;
  email: string;
  role: "superadmin" | "admin" | "manager" | "customer" | "guest";
}

// Custom configuration using builder
const ecommerceConfig = createRBACConfig<EcommerceUser>()
  .setDefaultRole("guest")
  .addRole("superadmin", {
    allow: [
      { action: ["create", "read", "update", "delete"], subject: "all" },
      { action: "manage", subject: "all" },
    ],
  })
  .addRole("admin", {
    allow: [
      { action: ["create", "read", "update", "delete"], subject: ["Product", "Order", "User"] },
      { action: "read", subject: "Settings" },
    ],
    forbid: [
      { action: "delete", subject: "User", conditions: { role: "superadmin" }, reason: "Cannot delete superadmins" },
      { action: "update", subject: ["User", "Settings"], fields: ["role", "permissions"], reason: "Cannot modify roles or permissions" },
    ],
  })
  .addRole("manager", {
    allow: [
      { action: ["create", "read", "update"], subject: ["Product", "Order"] },
      { action: "read", subject: ["User", "Settings"] },
    ],
    forbid: [
      { action: "delete", subject: "User" },
      { action: "update", subject: ["User", "Settings"], fields: ["role"] },
    ],
  })
  .addRole("customer", {
    allow: [
      { action: "create", subject: "Order", conditions: { customerId: "$userId" } },
      { action: ["read", "update"], subject: "Order", conditions: { customerId: "$userId" } },
      { action: "read", subject: "Product" },
    ],
    forbid: [
      { action: ["create", "update", "delete"], subject: ["Product", "User", "Settings"] },
      { action: "delete", subject: "Order", conditions: { status: { $in: ["shipped", "delivered"] } }, reason: "Cannot modify shipped orders" },
    ],
  })
  .addRole("guest", {
    allow: [
      { action: "read", subject: "Product", conditions: { isPublished: true } },
    ],
    forbid: [
      { action: ["create", "update", "delete"], subject: ["Order", "Product", "User", "Settings"] },
    ],
  })
  .setWildcardActions(["manage"])
  .build();

// ============================================
// Example 4: Using Permission Checker
// ============================================

// Mock schema for example purposes
const todosSchema = { todos: {} };

function createPermissionService(user: TodoUser | null) {
  const ability = createAbility(user, todoConfig);
  const checker = createPermissionChecker(ability, {
    resourceOwnerExtractor: (resource: any) => resource.userId,
    queryAdapter: new DrizzleQueryAdapter(todosSchema, {
      userIdField: "userId",
      isPublicField: "isPublic",
    }),
  });

  return {
    /**
     * Check if can create a resource
     */
    canCreate(resourceType: string): boolean {
      return checker.can("create", resourceType);
    },

    /**
     * Check if can read a specific resource
     */
    canRead(resource: any): boolean {
      return checker.can("read", resource);
    },

    /**
     * Check if can update a resource
     */
    canUpdate(resource: any): boolean {
      return checker.can("update", resource);
    },

    /**
     * Check if can delete a resource
     */
    canDelete(resource: any): boolean {
      return checker.can("delete", resource);
    },

    /**
     * Check if owns a resource
     */
    isOwner(resource: any): boolean {
      return checker.isOwner(resource, user?.id);
    },

    /**
     * Get query for accessible resources
     */
    getAccessibleQuery(action: string, resourceType: string) {
      return checker.getAccessibleResourcesQuery(user, action, resourceType);
    },

    /**
     * Batch check permissions
     */
    canBatch(checks: Array<{ action: string; resource?: any; field?: string }>) {
      return checker.canBatch(checks);
    },

    /**
     * Get all permissions for a resource type
     */
    getPermissionsForResource(resourceType: string) {
      return checker.getPermissionsForResource(resourceType);
    },
  };
}

// ============================================
// Example 5: React Hook for Client Components
// ============================================

import { useEffect, useState } from "react";
import { useAbility } from "../index";

function usePermissions(user: TodoUser | null, config: any) {
  const ability = useAbility(user, config);

  return {
    can: (action: string, subject?: any, field?: string) =>
      ability.can(action, subject || "all", field),
    cannot: (action: string, subject?: any, field?: string) =>
      !ability.can(action, subject || "all", field),
  };
}

// ============================================
// Example 6: Server-Side API Route Guard
// ============================================

import { NextRequest, NextResponse } from "next/server";

async function withPermission(
  request: NextRequest,
  config: any,
  requiredPermission: { action: string; resourceType: string }
) {
  // Get user from session
  const user = await getUserFromSession(request);

  // Check permission
  const ability = createAbility(user, config);
  const hasPermission = ability.can(
    requiredPermission.action,
    requiredPermission.resourceType
  );

  if (!hasPermission) {
    return NextResponse.json(
      { error: "Forbidden: Insufficient permissions" },
      { status: 403 }
    );
  }

  // Continue with the request
  return null;
}

// Helper function (implement based on your auth system)
async function getUserFromSession(request: NextRequest) {
  // Implementation depends on your auth system
  return null;
}

// ============================================
// Example 7: Data Access Layer with Permissions
// ============================================

class TodoDataAccess {
  private ability: ReturnType<typeof createAbility>;
  private queryAdapter: DrizzleQueryAdapter;

  constructor(
    private user: TodoUser | null,
    private config: any,
    private db: any
  ) {
    this.ability = createAbility(user, config);
    this.queryAdapter = new DrizzleQueryAdapter(db.schema, {
      userIdField: "userId",
      isPublicField: "isPublic",
    });
  }

  async findTodos() {
    // Check if user can read todos
    if (!this.ability.can("read", "Todo")) {
      throw new Error("Forbidden: You don't have permission to read todos");
    }

    // Get query filter based on permissions
    const query = this.queryAdapter.getAccessibleResourcesQuery(
      this.user,
      "read",
      "todos"
    );

    // Execute query with filter
    const todos = query
      ? await this.db.query.todos.findMany({ where: query })
      : await this.db.query.todos.findMany();

    // Additional client-side filtering (if needed)
    return todos.filter((todo: any) => this.ability.can("read", todo));
  }

  async createTodo(data: any) {
    // Check permission
    if (!this.ability.can("create", "Todo")) {
      throw new Error("Forbidden: You don't have permission to create todos");
    }

    // Create todo with user ownership
    const todo = await this.db.query.todos.create({
      data: {
        ...data,
        userId: this.user?.id,
      },
    });

    return todo;
  }

  async updateTodo(id: string, data: any) {
    // Get existing todo
    const existing = await this.db.query.todos.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Todo not found");
    }

    // Check permission
    if (!this.ability.can("update", existing)) {
      throw new Error("Forbidden: You don't have permission to update this todo");
    }

    // Update todo
    const todo = await this.db.query.todos.update({
      where: { id },
      data,
    });

    return todo;
  }

  async deleteTodo(id: string) {
    // Get existing todo
    const existing = await this.db.query.todos.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Todo not found");
    }

    // Check permission
    if (!this.ability.can("delete", existing)) {
      throw new Error("Forbidden: You don't have permission to delete this todo");
    }

    // Delete todo
    await this.db.query.todos.delete({ where: { id } });
  }
}

// ============================================
// Example 8: Field-Level Permissions
// ============================================

// Define config with field-level restrictions
const fieldLevelConfig = createRBACConfig<TodoUser>()
  .setDefaultRole("guest")
  .addRole("admin", {
    allow: [
      { action: ["read", "update", "delete"], subject: "Todo" },
    ],
    forbid: [
      // Admin cannot modify certain sensitive fields
      {
        action: "update",
        subject: "Todo",
        fields: ["title", "createdAt", "updatedAt"],
        reason: "Cannot modify these fields",
      },
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
    forbid: [
      // Users cannot make their todos public (security restriction)
      {
        action: "update",
        subject: "Todo",
        fields: ["isPublic"],
        conditions: { userId: "$userId" },
        reason: "Cannot change visibility of own todos",
      },
    ],
  })
  .build();

function checkFieldLevelPermissions(user: TodoUser, todo: any) {
  const ability = createAbility(user, fieldLevelConfig);

  console.log("Can update title?", ability.can("update", todo, "title"));
  console.log("Can update description?", ability.can("update", todo, "description"));
  console.log("Can update completed?", ability.can("update", todo, "completed"));
  console.log("Can update isPublic?", ability.can("update", todo, "isPublic"));
}
