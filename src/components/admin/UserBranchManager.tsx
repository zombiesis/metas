'use client';
import { useState } from 'react';

type User = { id: string; username: string; email?: string | null };
type Assignment = { userId: string; username: string };

export function UserBranchManager({ branchId, users, assigned }: { branchId: string; users: User[]; assigned: Assignment[] }) {
  const [assignments, setAssignments] = useState(assigned);
  const [selectedUser, setSelectedUser] = useState('');
  const [msg, setMsg] = useState('');

  const unassigned = users.filter(u => !assignments.some(a => a.userId === u.id));

  async function assign() {
    if (!selectedUser) return;
    const res = await fetch('/api/admin/branches/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branchId, userId: selectedUser }) });
    const data = await res.json();
    if (data.ok) {
      const user = users.find(u => u.id === selectedUser);
      setAssignments([...assignments, { userId: selectedUser, username: user?.username || '' }]);
      setSelectedUser('');
      setMsg('User assigned');
    } else setMsg(data.error || 'Failed');
    setTimeout(() => setMsg(''), 3000);
  }

  async function remove(userId: string) {
    const res = await fetch('/api/admin/branches/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ branchId, userId }) });
    const data = await res.json();
    if (data.ok) { setAssignments(assignments.filter(a => a.userId !== userId)); setMsg('Removed'); }
    else setMsg(data.error || 'Failed');
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="card">
      <h3>Branch Users ({assignments.length})</h3>
      {msg && <p className="toast-inline">{msg}</p>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select aria-label="Select user" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
          <option value="">Select user to assign...</option>
          {unassigned.map(u => <option key={u.id} value={u.id}>{u.username} {u.email ? `(${u.email})` : ''}</option>)}
        </select>
        <button className="btn gold" onClick={assign} disabled={!selectedUser}>Assign</button>
      </div>
      <ul className="dash-timeline">
        {assignments.map(a => (
          <li key={a.userId} className="dash-timeline-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{a.username}</span>
            <button className="btn outline" onClick={() => remove(a.userId)}>Remove</button>
          </li>
        ))}
      </ul>
      {assignments.length === 0 && <p className="empty-hint">No users assigned to this branch.</p>}
    </div>
  );
}
