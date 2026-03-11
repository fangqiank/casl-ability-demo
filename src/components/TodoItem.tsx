'use client';

import { Todo } from '@/lib/ability/types';
import { PermissionGuard } from './PermissionGuard';
import { useState } from 'react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Partial<Todo>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TodoItem({ todo, onToggle, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);

  const handleToggle = async () => {
    try {
      await onToggle(todo.id);
    } catch {
      alert('Failed to toggle todo');
    }
  };

  const handleUpdate = async () => {
    try {
      await onUpdate(todo.id, { title, description });
      setIsEditing(false);
    } catch {
      alert('Failed to update todo');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this todo?')) {
      try {
        await onDelete(todo.id);
      } catch {
        alert('Failed to delete todo');
      }
    }
  };

  const cancelEdit = () => {
    setTitle(todo.title);
    setDescription(todo.description);
    setIsEditing(false);
  };

  return (
    <div className={`todo-card ${todo.completed ? 'todo-card-completed' : ''}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <PermissionGuard action="toggle" todo={todo}>
          <div className="relative pt-1">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={handleToggle}
              className="custom-checkbox"
            />
            <svg className={`w-3 h-3 text-white absolute top-1.5 left-1.5 pointer-events-none transition-opacity ${todo.completed ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </PermissionGuard>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Title"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-none"
                placeholder="Description"
                rows={2}
              />
            </div>
          ) : (
            <div>
              <h3 className={`font-semibold text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                {todo.title}
              </h3>
              {todo.description && (
                <p className={`text-sm mt-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                  {todo.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${todo.isPublic ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                  {todo.isPublic ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Public
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private
                    </>
                  )}
                </span>
                <span>•</span>
                <span>{new Date(todo.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <PermissionGuard action="update" todo={todo}>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpdate}
                  className="btn-success flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-info flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </PermissionGuard>

          <PermissionGuard action="delete" todo={todo}>
            <button
              onClick={handleDelete}
              className="btn-danger flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </PermissionGuard>
        </div>
      </div>
    </div>
  );
}
