import {BaseUser, ResourceAction, QueryAdapter, ResourceOwnerExtractor, AppAbility} from "./types";

/**
 * Universal Permission Checker
 * Provides high-level permission checking methods
 */
export class PermissionChecker<
  TUser extends BaseUser = BaseUser,
  TResource extends object = object,
> {
  constructor(
    private ability: AppAbility,
    private config?: {
      resourceOwnerExtractor?: ResourceOwnerExtractor<TResource>;
      queryAdapter?: QueryAdapter<any>;
    }
  ) {}

  /**
   * Check if user can perform an action on a resource
   */
  can(
    action: ResourceAction,
    resource?: TResource | string,
    field?: string
  ): boolean {
    if (typeof resource === "string") {
      // Check by resource type
      return this.ability.can(action, resource, field);
    }

    if (resource) {
      // Check by resource instance
      return this.ability.can(action, resource, field);
    }

    // Check without resource context
    return this.ability.can(action, "all");
  }

  /**
   * Check if user cannot perform an action
   */
  cannot(
    action: ResourceAction,
    resource?: TResource | string,
    field?: string
  ): boolean {
    return !this.can(action, resource, field);
  }

  /**
   * Check if user owns a resource
   */
  isOwner(resource: TResource, userId?: string): boolean {
    if (!this.config?.resourceOwnerExtractor) {
      return false;
    }

    const ownerId = this.config.resourceOwnerExtractor(resource);
    if (!ownerId) {
      return false;
    }

    return userId === ownerId;
  }

  /**
   * Get query for accessible resources
   */
  getAccessibleResourcesQuery(
    user: BaseUser | null,
    action: ResourceAction,
    resourceType: string
  ): any {
    if (!this.config?.queryAdapter) {
      return undefined;
    }

    return this.config.queryAdapter.getAccessibleResourcesQuery(
      user,
      action,
      resourceType
    );
  }

  /**
   * Batch permission check
   */
  canBatch(checks: Array<{
    action: ResourceAction;
    resource?: TResource | string;
    field?: string;
  }>): Record<string, boolean> {
    const results: Record<string, boolean> = {};

    checks.forEach((check, index) => {
      const key = `check_${index}`;
      results[key] = this.can(check.action, check.resource, check.field);
    });

    return results;
  }

  /**
   * Get all permissions for a resource type
   */
  getPermissionsForResource(resourceType: string): ResourceAction[] {
    const actions: ResourceAction[] = [];
    const possibleActions: ResourceAction[] = [
      "create",
      "read",
      "update",
      "delete",
      "manage",
    ];

    possibleActions.forEach((action) => {
      if (this.can(action, resourceType)) {
        actions.push(action);
      }
    });

    return actions;
  }
}

/**
 * Factory function to create permission checker
 */
export function createPermissionChecker<
  TUser extends BaseUser = BaseUser,
  TResource extends object = object,
>(
  ability: AppAbility,
  config?: {
    resourceOwnerExtractor?: ResourceOwnerExtractor<TResource>;
    queryAdapter?: QueryAdapter<any>;
  }
): PermissionChecker<TUser, TResource> {
  return new PermissionChecker(ability, config);
}

/**
 * Query builder helper for common ORM patterns
 */
export class QueryBuilder {
  /**
   * Build a query for accessible resources
   * Common pattern: user's own resources + public resources
   */
  static buildOwnerOrPublicQuery(
    userId: string | undefined,
    userIdField: string,
    isPublicField: string
  ): Record<string, any> {
    if (!userId) {
      return { [isPublicField]: true };
    }

    // Return OR condition - adjust for your ORM
    return {
      $or: [
        { [userIdField]: userId },
        { [isPublicField]: true },
      ],
    };
  }

  /**
   * Build a query for user's own resources
   */
  static buildOwnerQuery(
    userId: string,
    userIdField: string
  ): Record<string, any> {
    return { [userIdField]: userId };
  }

  /**
   * Build a query for public resources
   */
  static buildPublicQuery(isPublicField: string): Record<string, any> {
    return { [isPublicField]: true };
  }

  /**
   * Build an "all access" query (no filter)
   */
  static buildAllQuery(): undefined {
    return undefined;
  }

  /**
   * Build a "no access" query (impossible condition)
   */
  static buildNoAccessQuery(): Record<string, any> {
    return { _id: null }; // Adjust for your ORM
  }
}
