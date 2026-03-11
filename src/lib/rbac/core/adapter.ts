import {BaseUser, ResourceAction, QueryAdapter} from "./types";

/**
 * Universal Query Adapter Interface
 * Implement this for your specific ORM
 */
export interface IQueryAdapter {
  /**
   * Get query/filter for accessible resources
   */
  getAccessibleResourcesQuery(
    user: BaseUser | null,
    action: ResourceAction,
    resourceType: string
  ): any;
}

/**
 * Drizzle ORM Query Adapter
 */
export class DrizzleQueryAdapter implements IQueryAdapter {
  constructor(
    private schema: Record<string, any>,
    private config: {
      userIdField?: string;
      isPublicField?: string;
      ownerField?: string;
    } = {}
  ) {
    this.config = {
      userIdField: "userId",
      isPublicField: "isPublic",
      ownerField: "userId",
      ...config,
    };
  }

  getAccessibleResourcesQuery(
    user: BaseUser | null,
    action: ResourceAction,
    resourceType: string
  ): any {
    const { eq, or, and } = require("drizzle-orm");
    const table = this.schema[resourceType];

    if (!user) {
      // Guest - only public resources
      return eq(table.isPublic, true);
    }

    // Check if user is admin or has special role
    if (user.role === "admin") {
      return undefined; // No filter - access to all
    }

    // Regular user - own resources + public resources
    return or(
      eq(table.isPublic, true),
      eq(table.userId, user.id)
    );
  }

  /**
   * Build owner query
   */
  buildOwnerQuery(userId: string, resourceType: string): any {
    const { eq } = require("drizzle-orm");
    const table = this.schema[resourceType];
    return eq(table.userId, userId);
  }

  /**
   * Build public query
   */
  buildPublicQuery(resourceType: string): any {
    const { eq } = require("drizzle-orm");
    const table = this.schema[resourceType];
    return eq(table.isPublic, true);
  }
}

/**
 * Prisma ORM Query Adapter
 */
export class PrismaQueryAdapter implements IQueryAdapter {
  constructor(
    private config: {
      userIdField?: string;
      isPublicField?: string;
    } = {}
  ) {
    this.config = {
      userIdField: "userId",
      isPublicField: "isPublic",
      ...config,
    };
  }

  getAccessibleResourcesQuery(
    user: BaseUser | null,
    action: ResourceAction,
    resourceType: string
  ): any {
    if (!user) {
      // Guest - only public resources
      return {
        [this.config.isPublicField!]: true,
      };
    }

    if (user.role === "admin") {
      return undefined; // No filter
    }

    // Regular user - own resources OR public resources
    return {
      OR: [
        { [this.config.userIdField!]: user.id },
        { [this.config.isPublicField!]: true },
      ],
    };
  }

  /**
   * Build owner query for Prisma
   */
  buildOwnerQuery(userId: string): any {
    return {
      [this.config.userIdField!]: userId,
    };
  }

  /**
   * Build public query for Prisma
   */
  buildPublicQuery(): any {
    return {
      [this.config.isPublicField!]: true,
    };
  }
}

/**
 * Mongoose Query Adapter
 */
export class MongooseQueryAdapter implements IQueryAdapter {
  constructor(
    private config: {
      userIdField?: string;
      isPublicField?: string;
    } = {}
  ) {
    this.config = {
      userIdField: "userId",
      isPublicField: "isPublic",
      ...config,
    };
  }

  getAccessibleResourcesQuery(
    user: BaseUser | null,
    action: ResourceAction,
    resourceType: string
  ): any {
    if (!user) {
      // Guest - only public resources
      return { [this.config.isPublicField!]: true };
    }

    if (user.role === "admin") {
      return {}; // No filter
    }

    // Regular user - own resources OR public resources
    return {
      $or: [
        { [this.config.userIdField!]: user.id },
        { [this.config.isPublicField!]: true },
      ],
    };
  }

  /**
   * Build owner query for Mongoose
   */
  buildOwnerQuery(userId: string): any {
    return { [this.config.userIdField!]: userId };
  }

  /**
   * Build public query for Mongoose
   */
  buildPublicQuery(): any {
    return { [this.config.isPublicField!]: true };
  }
}

/**
 * Generic SQL Query Adapter
 * Works with Knex, Sequelize, Kysely, etc.
 */
export class SQLQueryAdapter implements IQueryAdapter {
  constructor(
    private config: {
      userIdField?: string;
      isPublicField?: string;
      tablePrefix?: string;
    } = {}
  ) {
    this.config = {
      userIdField: "userId",
      isPublicField: "isPublic",
      tablePrefix: "",
      ...config,
    };
  }

  getAccessibleResourcesQuery(
    user: BaseUser | null,
    action: ResourceAction,
    resourceType: string
  ): any {
    if (!user) {
      // Guest - only public resources
      return {
        [`${this.config.tablePrefix}${resourceType}.${this.config.isPublicField!}`]:
          true,
      };
    }

    if (user.role === "admin") {
      return undefined; // No filter
    }

    // Regular user - own resources OR public resources
    const userIdField = `${this.config.tablePrefix}${resourceType}.${this.config.userIdField!}`;
    const isPublicField = `${this.config.tablePrefix}${resourceType}.${this.config.isPublicField!}`;

    return {
      $or: [
        { [userIdField]: user.id },
        { [isPublicField]: true },
      ],
    };
  }

  /**
   * Build owner query for SQL
   */
  buildOwnerQuery(resourceType: string): any {
    return {
      [`${this.config.tablePrefix}${resourceType}.${this.config.userIdField!}`]:
        "",
    };
  }

  /**
   * Build public query for SQL
   */
  buildPublicQuery(resourceType: string): any {
    return {
      [`${this.config.tablePrefix}${resourceType}.${this.config.isPublicField!}`]:
        true,
    };
  }
}

/**
 * Factory function to create query adapter
 */
export function createQueryAdapter(
  type: "drizzle" | "prisma" | "mongoose" | "sql",
  schema?: Record<string, any>,
  config?: Record<string, any>
): IQueryAdapter {
  switch (type) {
    case "drizzle":
      if (!schema) {
        throw new Error("Schema is required for drizzle adapter");
      }
      return new DrizzleQueryAdapter(schema, config);
    case "prisma":
      return new PrismaQueryAdapter(config);
    case "mongoose":
      return new MongooseQueryAdapter(config);
    case "sql":
      return new SQLQueryAdapter(config);
    default:
      throw new Error(`Unsupported adapter type: ${type}`);
  }
}
