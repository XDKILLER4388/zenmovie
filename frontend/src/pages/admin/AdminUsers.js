import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (user) => {
    try {
      await api.updateUser(user.id, { role: user.role, is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUser(user.id, { role: newRole, is_active: user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h2 className="admin-section-title">Users ({users.length})</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 20, borderRadius: 4 }} /></td></tr>
                ))
              : users.map(u => (
                  <tr key={u.id}>
                    <td className="admin-table__title">{u.username}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                    <td>
                      <button onClick={() => toggleRole(u)} className={`admin-toggle ${u.role === 'admin' ? 'on' : 'off'}`}>
                        {u.role}
                      </button>
                    </td>
                    <td>
                      <button onClick={() => toggleActive(u)} className={`admin-toggle ${u.is_active ? 'on' : 'off'}`}>
                        {u.is_active ? 'Active' : 'Banned'}
                      </button>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
