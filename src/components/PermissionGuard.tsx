'use client'

import { ReactNode, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { User as RBACUser } from '@/lib/rbac/config';
import { createAbility } from '@/lib/rbac';
import { rbacConfig } from '@/lib/rbac/config';
import { Todo } from '@/lib/ability/types';

interface PermissionGuardProps {
  children: ReactNode;
  action: 'create' | 'read' | 'update' | 'delete' | 'toggle';
  todo?: Todo;
  fallback?: ReactNode;
}

export function PermissionGuard({
  children,
  action,
  todo,
  fallback = null
}: PermissionGuardProps) {
  const { data: session } = useSession();
  const user = session?.user as RBACUser | null;

  const ability = useMemo(() => {
    return createAbility(user, rbacConfig);
  }, [user]);

  const hasPermission = useMemo(() => {
    if (todo) {
      return ability.can(action, todo);
    }
    return ability.can(action, 'Todo');
  }, [ability, action, todo]);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
