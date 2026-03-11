import {AbilityBuilder, createMongoAbility} from "@casl/ability";
import {
  BaseUser,
  AppAbility,
  RBACConfig,
  PermissionRule,
  ResourceAction,
} from "./types";

/**
 * Universal Permission Builder
 * Builds CASL abilities from role-based configuration
 */
export class PermissionBuilder<TUser extends BaseUser = BaseUser> {
  private user: TUser | null;
  private config: RBACConfig<TUser>;

  constructor(user: TUser | null, config: RBACConfig<TUser>) {
    this.user = user;
    this.config = config;
  }

  /**
   * Get user's effective roles (including inherited roles)
   */
  private getEffectiveRoles(): string[] {
    if (!this.user) {
      return [this.config.defaultRole || "guest"];
    }

    const userRole = this.user.role || this.config.defaultRole || "guest";
    const roles: string[] = [userRole];

    // Add inherited roles
    const addInheritedRoles = (role: string) => {
      const inherited = this.config.roleInheritance?.[role];
      if (inherited) {
        inherited.forEach((inheritedRole) => {
          if (!roles.includes(inheritedRole)) {
            roles.push(inheritedRole);
            addInheritedRoles(inheritedRole);
          }
        });
      }
    };

    addInheritedRoles(userRole);
    return roles;
  }

  /**
   * Check if action is a wildcard action
   */
  private isWildcardAction(action: ResourceAction): boolean {
    return this.config.wildcardActions?.includes(action) || false;
  }

  /**
   * Build permission rules for a specific role
   */
  private buildRoleRules(role: string): {
    allow: PermissionRule[];
    forbid: PermissionRule[];
  } {
    const roleConfig = this.config.roles[role];
    if (!roleConfig) {
      return { allow: [], forbid: [] };
    }

    return {
      allow: roleConfig.permissions.allow || [],
      forbid: roleConfig.permissions.forbid || [],
    };
  }

  /**
   * Apply a single permission rule to the ability builder
   */
  private applyRule(
    can: (...args: any[]) => void,
    cannot: (...args: any[]) => void,
    rule: PermissionRule,
    type: "allow" | "forbid"
  ): void {
    const method = type === "allow" ? can : cannot;
    const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
    const subjects = Array.isArray(rule.subject) ? rule.subject : [rule.subject];

    actions.forEach((action) => {
      subjects.forEach((sub) => {
        // Use subject directly - detectSubjectType at ability level handles object matching
        const params: any[] = [action, sub];

        // Add conditions if present - replace placeholders
        if (rule.conditions) {
          const conditions = this.replacePlaceholders(rule.conditions);
          params.push(conditions);
        }

        // Add field restrictions if present
        if (rule.fields) {
          params.push(rule.fields);
        }

        // Add reason for forbid rules
        if (type === "forbid" && rule.reason) {
          params.push({ because: rule.reason });
        }

        method(...params);
      });
    });
  }

  /**
   * Replace placeholders like $userId with actual values
   */
  private replacePlaceholders(conditions: any): any {
    if (!conditions) return conditions;

    if (Array.isArray(conditions)) {
      return conditions.map(c => this.replacePlaceholders(c));
    }

    if (typeof conditions === 'object' && conditions !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(conditions)) {
        if (typeof value === 'string' && value === '$userId') {
          result[key] = this.user?.id;
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.replacePlaceholders(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }

    return conditions;
  }

  /**
   * Build the CASL ability instance
   */
  public build(): AppAbility {
    const {can, cannot, build} = new AbilityBuilder(createMongoAbility);

    const roles = this.getEffectiveRoles();

    // Process each role's permissions
    roles.forEach((role) => {
      const {allow, forbid} = this.buildRoleRules(role);

      // Apply allow rules
      allow.forEach((rule) => this.applyRule(can, cannot, rule, "allow"));

      // Apply forbid rules
      forbid.forEach((rule) => this.applyRule(can, cannot, rule, "forbid"));
    });

    const ability = build({
      // Add subject type detection so CASL can match objects to string subjects
      detectSubjectType: (object: any) => {
        if (object && typeof object === 'object') {
          // Check if it's a Todo object
          if ('title' in object && 'userId' in object && typeof object.userId === 'string') {
            return 'Todo';
          }
          // Check if it's a User object
          if ('email' in object && 'role' in object && typeof object.role === 'string') {
            return 'User';
          }
        }
        return 'all';
      }
    });

    return ability as AppAbility;
  }
}

/**
 * Factory function to create permission builder
 */
export function createPermissionBuilder<TUser extends BaseUser = BaseUser>(
  config: RBACConfig<TUser>
) {
  return (user: TUser | null) => new PermissionBuilder(user, config);
}

/**
 * Simplified API - create ability directly from config and user
 */
export function createAbility<TUser extends BaseUser = BaseUser>(
  user: TUser | null,
  config: RBACConfig<TUser>
): AppAbility {
  const builder = new PermissionBuilder(user, config);
  return builder.build();
}

/**
 * Hook-like function for client components
 */
export function useAbility<TUser extends BaseUser = BaseUser>(
  user: TUser | null,
  config: RBACConfig<TUser>
): AppAbility {
  return createAbility(user, config);
}
