'use client';

import { useState, useEffect } from 'react';
import { Todo } from '@/lib/ability/types';
import { TodoItem } from './TodoItem';
import { PermissionGuard } from './PermissionGuard';

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState({ title: '', description: '', isPublic: false });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo)
      });

      if (!res.ok) throw new Error('Failed to create');

      const todo = await res.json();
      setTodos([todo, ...todos]);
      setNewTodo({ title: '', description: '', isPublic: false });
    } catch (error) {
      console.error('Failed to create todo:', error);
      alert('Failed to create todo');
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}/toggle`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Failed to toggle');

      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
      throw error;
    }
  };

  const handleUpdateTodo = async (id: string, data: Partial<Todo>) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error('Failed to update');

      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');

      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Todo Form */}
      <PermissionGuard action="create">
        <div className="glass-card-strong rounded-2xl p-6 fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Create New Todo</h2>
          </div>

          <form onSubmit={handleCreateTodo} className="space-y-4">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="input-field"
              required
            />
            <textarea
              placeholder="Add a description (optional)"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="input-field resize-none"
              rows={2}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={newTodo.isPublic}
                    onChange={(e) => setNewTodo({ ...newTodo, isPublic: e.target.checked })}
                    className="custom-checkbox"
                  />
                  <svg className="w-3 h-3 text-white absolute top-1 left-1 pointer-events-none opacity-0 check-icon transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                  Make public
                </span>
              </label>
              <button
                type="submit"
                className="btn-success flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Todo
              </button>
            </div>
          </form>
        </div>
      </PermissionGuard>

      {/* Todo List */}
      <div className="space-y-3">
        {todos.map((todo, index) => (
          <div key={todo.id} className="fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
            <TodoItem
              todo={todo}
              onToggle={handleToggleTodo}
              onUpdate={handleUpdateTodo}
              onDelete={handleDeleteTodo}
            />
          </div>
        ))}
      </div>

      {/* Empty State */}
      {todos.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center fade-in-up">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-linear-to-br from-orange-100 to-pink-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No todos yet</h3>
          <p className="text-gray-500">Create your first todo to get started!</p>
        </div>
      )}
    </div>
  );
}
