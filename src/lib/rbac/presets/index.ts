import {RBACConfig, BaseUser} from "../core/types";

/**
 * Predefined role configurations for common use cases
 */

/**
 * Simple 3-tier RBAC configuration
 * Admin > User > Guest
 */
export function createSimpleRBACConfig<TUser extends BaseUser>(
  options?: {
    adminCanManageAll?: boolean;
    userCanCreatePublic?: boolean;
    guestCanReadPublic?: boolean;
  }
): RBACConfig<TUser> {
  const {
    adminCanManageAll = true,
    userCanCreatePublic = false,
    guestCanReadPublic = true,
  } = options || {};

  return {
    defaultRole: "guest",
    roles: {
      admin: {
        permissions: {
          allow: adminCanManageAll
            ? [
                { action: "manage", subject: "all" },
              ]
            : [
                { action: "create", subject: "all" },
                { action: "read", subject: "all" },
                { action: "update", subject: "all" },
                { action: "delete", subject: "all" },
              ],
        },
      },
      user: {
        permissions: {
          allow: [
            { action: "create", subject: "all" },
            { action: "read", subject: "all" },
          ],
          forbid: [
            {
              action: "delete",
              subject: "all",
              conditions: { owner: { $ne: "$userId" } },
              reason: "Cannot delete others' resources",
            },
          ],
        },
      },
      guest: {
        permissions: {
          allow: guestCanReadPublic
            ? [{ action: "read", subject: "all", conditions: { isPublic: true } }]
            : [],
          forbid: [
            { action: "create", subject: "all" },
            { action: "update", subject: "all" },
            { action: "delete", subject: "all" },
          ],
        },
      },
    },
  };
}

/**
 * Resource Owner RBAC configuration
 * Users can only manage their own resources
 */
export function createOwnerBasedRBACConfig<
  TUser extends BaseUser
>(options?: {
  adminCanManageAll?: boolean;
  allowPublicResources?: boolean;
}): RBACConfig<TUser> {
  const { adminCanManageAll = true, allowPublicResources = true } = options || {};

  return {
    defaultRole: "guest",
    roles: {
      admin: {
        permissions: {
          allow: adminCanManageAll
            ? [{ action: "manage", subject: "all" }]
            : [
                { action: "create", subject: "all" },
                { action: "read", subject: "all" },
                { action: "update", subject: "all" },
                { action: "delete", subject: "all" },
              ],
        },
      },
      user: {
        permissions: {
          allow: [
            { action: "create", subject: "all" },
            {
              action: "read",
              subject: "all",
              conditions: {
                $or: [{ userId: "$userId" }, { isPublic: allowPublicResources ? true : false }],
              },
            },
            {
              action: "update",
              subject: "all",
              conditions: { userId: "$userId" },
            },
            {
              action: "delete",
              subject: "all",
              conditions: { userId: "$userId" },
            },
          ],
        },
      },
      guest: {
        permissions: {
          allow: allowPublicResources
            ? [{ action: "read", subject: "all", conditions: { isPublic: true } }]
            : [],
          forbid: [
            { action: "create", subject: "all" },
            { action: "update", subject: "all" },
            { action: "delete", subject: "all" },
          ],
        },
      },
    },
  };
}

/**
 * Team/Organization RBAC configuration
 * With roles like Owner, Admin, Member, Guest
 */
export function createTeamRBACConfig<
  TUser extends BaseUser & { teamId?: string }
>(options?: {
  allowCrossTeamAccess?: boolean;
}): RBACConfig<TUser> {
  const { allowCrossTeamAccess = false } = options || {};

  return {
    defaultRole: "guest",
    roleInheritance: {
      admin: ["member"],
      owner: ["admin", "member"],
    },
    roles: {
      owner: {
        permissions: {
          allow: [{ action: "manage", subject: "all" }],
        },
      },
      admin: {
        permissions: {
          allow: [
            { action: "create", subject: "all" },
            { action: "read", subject: "all" },
            { action: "update", subject: "all" },
            { action: "delete", subject: "all" },
          ],
          forbid: [
            {
              action: "delete",
              subject: "all",
              conditions: { role: "owner" },
              reason: "Cannot delete owner's resources",
            },
          ],
        },
      },
      member: {
        permissions: {
          allow: [
            { action: "create", subject: "all" },
            {
              action: "read",
              subject: "all",
              conditions: {
                $or: [{ userId: "$userId" }, { teamId: allowCrossTeamAccess ? "$teamId" : "$userId" }],
              },
            },
            {
              action: "update",
              subject: "all",
              conditions: { userId: "$userId" },
            },
            {
              action: "delete",
              subject: "all",
              conditions: { userId: "$userId" },
            },
          ],
        },
      },
      guest: {
        permissions: {
          forbid: [
            { action: "create", subject: "all" },
            { action: "update", subject: "all" },
            { action: "delete", subject: "all" },
          ],
        },
      },
    },
  };
}

/**
 * Custom RBAC configuration builder
 * Allows fluent configuration of roles and permissions
 */
export class RBACConfigBuilder<TUser extends BaseUser> {
  private config: RBACConfig<TUser> = {
    defaultRole: "guest",
    roles: {},
    roleInheritance: {},
  };

  /**
   * Set default role
   */
  setDefaultRole(role: string): this {
    this.config.defaultRole = role;
    return this;
  }

  /**
   * Add a role with permissions
   */
  addRole(
    name: string,
    permissions: {
      allow?: Array<{
        action: string | string[];
        subject?: string | string[];
        conditions?: Record<string, any>;
        fields?: string[];
        reason?: string;
      }>;
      forbid?: Array<{
        action: string | string[];
        subject?: string | string[];
        conditions?: Record<string, any>;
        fields?: string[];
        reason?: string;
      }>;
    }
  ): this {
    this.config.roles[name] = {
      permissions: {
        allow: permissions.allow?.map((p) => ({
          action: p.action,
          subject: p.subject || "all",
          conditions: p.conditions,
          fields: p.fields,
          ...(p.reason ? { reason: p.reason } : {}),
        })),
        forbid: permissions.forbid?.map((p) => ({
          action: p.action,
          subject: p.subject || "all",
          conditions: p.conditions,
          fields: p.fields,
          ...(p.reason ? { reason: p.reason } : {}),
        })),
      },
    };
    return this;
  }

  /**
   * Add role inheritance
   */
  addInheritance(role: string, inheritsFrom: string[]): this {
    this.config.roleInheritance![role] = inheritsFrom;
    return this;
  }

  /**
   * Set wildcard actions
   */
  setWildcardActions(actions: string[]): this {
    this.config.wildcardActions = actions;
    return this;
  }

  /**
   * Build the configuration
   */
  build(): RBACConfig<TUser> {
    return this.config;
  }
}

/**
 * Factory function to create config builder
 */
export function createRBACConfig<
  TUser extends BaseUser
>(): RBACConfigBuilder<TUser> {
  return new RBACConfigBuilder<TUser>();
}
