import {Ability, AbilityTuple, MongoQuery} from "@casl/ability";

/**
 * Generic condition types for MongoDB-style queries
 * Can be extended for specific resource conditions
 */
export type Conditions = MongoQuery<Record<string, any>>;

/**
 * Base user interface - extend this for your application
 */
export interface BaseUser {
  id: string;
  role: string;
  [key: string]: any;
}

/**
 * Resource action types
 * Can be extended with custom actions
 */
export type ResourceAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | string; // Allow custom actions

/**
 * Resource subject types
 */
export type ResourceSubject = string | object;

export const all = Symbol("all");

/**
 * Generic Ability type
 * Uses CASL's Ability with proper generic support
 */
export type AppAbility = Ability<
  AbilityTuple<
    ResourceAction,
    ResourceSubject
  >,
  Conditions
>;

/**
 * Permission rule configuration
 */
export interface PermissionRule {
  action: ResourceAction | ResourceAction[];
  subject: ResourceSubject | ResourceSubject[];
  conditions?: Record<string, any>;
  fields?: string[];
  reason?: string;
}

/**
 * Role configuration
 * Defines permissions for each role
 */
export interface RoleConfig {
  inherits?: string[]; // Role inheritance
  permissions: {
    allow?: PermissionRule[];
    forbid?: PermissionRule[];
  };
}

/**
 * RBAC Configuration
 * Central configuration for the permission system
 */
export interface RBACConfig<
  TUser extends BaseUser = BaseUser,
  TResource extends object = object,
> {
  /**
   * Default role if user has no role
   */
  defaultRole?: string;

  /**
   * Role definitions
   * Key is role name, value is role configuration
   */
  roles: Record<string, Omit<RoleConfig, 'inherits'>>;

  /**
   * Role inheritance map
   */
  roleInheritance?: Record<string, string[]>;

  /**
   * Custom action handlers (optional)
   */
  actionHandlers?: Record<string, (user: TUser, resource?: TResource) => boolean>;

  /**
   * Wildcard actions - actions that apply to all resources
   */
  wildcardActions?: ResourceAction[];
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Query adapter for database filtering
 */
export interface QueryAdapter<T = any> {
  getAccessibleResourcesQuery(
    user: BaseUser | null,
    action: ResourceAction,
    resourceType: string
  ): T | undefined;
}

/**
 * Resource owner extractor
 * Used to determine if a user owns a resource
 */
export type ResourceOwnerExtractor<TResource extends object = any> = (
  resource: TResource
) => string | undefined | null;

/**
 * Context for permission evaluation
 */
export interface PermissionContext<
  TUser extends BaseUser = BaseUser,
  TResource extends object = object,
> {
  user: TUser | null;
  action: ResourceAction;
  resource?: TResource;
  resourceType?: string;
  conditions?: Record<string, any>;
}
