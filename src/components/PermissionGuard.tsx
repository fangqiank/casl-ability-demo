'use client'

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { User, Todo } from '@/lib/ability/types';
import { getUserPermissions } from '@/lib/ability/permissions';

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
  const user = session?.user as User | null;
  const permissions = getUserPermissions(user);

  let hasPermission = false;

  switch (action) {
    case 'create':
      hasPermission = permissions.canCreateTodo(user?.id || '');
      break;
    case 'read':
      hasPermission = todo ? permissions.canReadTodo(user?.id || '', todo) : true;
      break;
    case 'update':
      hasPermission = todo ? permissions.canUpdateTodo(user?.id || '', todo) : false;
      break;
    case 'delete':
      hasPermission = todo ? permissions.canDeleteTodo(user?.id || '', todo) : false;
      break;
    case 'toggle':
      hasPermission = todo ? permissions.canToggleTodo(user?.id || '', todo) : false;
      break;
  }

	return hasPermission ? <>{children}</> : <>{fallback}</>;
}