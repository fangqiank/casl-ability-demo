import {User, Todo, PermissionFunctions} from "./types";
import {TodoAbilityBuilder} from "./builder";

export function getUserPermissions(user: User | null): PermissionFunctions {
  const builder = new TodoAbilityBuilder(user);
  const ability = builder.getAbility();

  return {
    canCreateTodo: () => {
      return ability.can("create", "Todo");
    },

    canReadTodo: (userId: string, todo: Todo) => {
      return ability.can("read", todo);
    },

    canUpdateTodo: (userId: string, todo: Todo) => {
      return ability.can("update", todo);
    },

    canDeleteTodo: (userId: string, todo: Todo) => {
      return ability.can("delete", todo);
    },

    canToggleTodo: (userId: string, todo: Todo) => {
      return ability.can("toggle", todo);
    },
  };
}
