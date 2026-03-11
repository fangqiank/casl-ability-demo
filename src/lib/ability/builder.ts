import {AbilityBuilder, createMongoAbility} from "@casl/ability";
import {
  User,
  AppAbility,
  PermissionAction,
  PermissionSubject,
  Todo,
} from "./types";

export class TodoAbilityBuilder {
  private ability: AppAbility;

  constructor(private user: User | null) {
    this.ability = this.buildAbility();
  }

  private buildAbility(): AppAbility {
    const {can, cannot, build} = new AbilityBuilder(createMongoAbility);

    if (!this.user) {
      // 游客权限
      can("read", "Todo", {isPublic: true});
      cannot("create", "Todo");
      cannot("update", "Todo");
      cannot("delete", "Todo");
      cannot("toggle", "Todo");
    } else if (this.user.role === "admin") {
      // 管理员权限
      can("manage", "all");

      // 特殊限制：管理员不能修改待办事项标题
      cannot("update", "Todo", ["title"]).because("管理员不能修改待办事项标题");
    } else {
      // 普通用户权限
      can("read", "Todo", {isPublic: true});
      can("read", "Todo", {userId: this.user.id});
      can("create", "Todo");
      can("update", "Todo", {userId: this.user.id});
      can("delete", "Todo", {userId: this.user.id});
      can("toggle", "Todo", {userId: this.user.id});

      // 禁止修改公共待办事项
      cannot("update", "Todo", {
        isPublic: true,
        userId: {$ne: this.user.id},
      });

      // 禁止删除不是自己创建的待办事项
      cannot("delete", "Todo", {
        userId: {$ne: this.user.id},
      });
    }

    return build() as AppAbility;
  }

  getAbility(): AppAbility {
    return this.ability;
  }

  can(
    action: PermissionAction,
    subject: PermissionSubject,
    field?: string,
  ): boolean {
    return this.ability.can(action, subject, field);
  }

  canWithTodo(action: PermissionAction, todo: Todo): boolean {
    return this.ability.can(action, todo);
  }

  getRules() {
    return this.ability.rules;
  }
}

export function useAbility(user: User | null) {
  const builder = new TodoAbilityBuilder(user);
  return builder.getAbility();
}
