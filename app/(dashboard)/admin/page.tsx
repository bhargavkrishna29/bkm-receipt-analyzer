'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { AdminUser, UserRole } from '@/types';

// ── Role badge colours ────────────────────────────────────────────────────
const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-error/15 text-error border border-error/30',
  editor: 'bg-primary/15 text-primary border border-primary/30',
  viewer: 'bg-surface-variant text-on-surface-variant border border-outline-variant',
};

const ROLE_ICONS: Record<UserRole, string> = {
  admin: 'shield',
  editor: 'edit',
  viewer: 'visibility',
};

// ── Helpers ───────────────────────────────────────────────────────────────
function initials(user: AdminUser) {
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return '?';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Reset-password modal ──────────────────────────────────────────────────
function ResetModal({
  link,
  email,
  onClose,
}: {
  link: string;
  email: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-lg border border-outline-variant">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-primary">lock_reset</span>
          <h3 className="font-headline-sm text-on-surface font-bold">Password Reset Link</h3>
        </div>
        <p className="font-body-sm text-on-surface-variant mb-md">
          Share this link with <span className="text-on-surface font-medium">{email}</span>. It expires after one use.
        </p>
        <div className="bg-surface-container rounded-lg px-md py-sm font-mono text-xs text-on-surface break-all mb-md border border-outline-variant/50">
          {link}
        </div>
        <div className="flex gap-sm justify-end">
          <button
            onClick={onClose}
            className="px-md py-sm border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
          >
            Close
          </button>
          <button
            onClick={copy}
            className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-md flex items-center gap-xs hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm-delete modal ──────────────────────────────────────────────────
function DeleteModal({
  user,
  onConfirm,
  onClose,
}: {
  user: AdminUser;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-lg border border-outline-variant">
        <div className="flex items-center gap-sm mb-md">
          <span className="material-symbols-outlined text-error">person_remove</span>
          <h3 className="font-headline-sm text-on-surface font-bold">Remove User</h3>
        </div>
        <p className="font-body-sm text-on-surface-variant mb-md">
          Are you sure you want to permanently delete{' '}
          <span className="text-on-surface font-medium">{user.name || user.email}</span>? This will remove their account from Firebase Auth. Their receipts are retained.
        </p>
        <div className="flex gap-sm justify-end">
          <button
            onClick={onClose}
            className="px-md py-sm border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-md py-sm bg-error text-on-error rounded-lg font-label-md flex items-center gap-xs hover:bg-error/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Role update state
  const [savingRole, setSavingRole] = useState<string | null>(null);

  // Reset password modal
  const [resetModal, setResetModal] = useState<{ link: string; email: string } | null>(null);
  const [resettingUid, setResettingUid] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState('');
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) { router.replace('/dashboard'); return; }
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data.users);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/'); return; }
    if (status === 'authenticated') fetchUsers();
  }, [status, fetchUsers, router]);

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setSavingRole(uid);
    try {
      const res = await fetch('/api/admin/users/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
      showToast(`Role updated to ${role}`);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to update role');
    } finally {
      setSavingRole(null);
    }
  };

  const handleResetPassword = async (uid: string) => {
    setResettingUid(uid);
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetModal({ link: data.resetLink, email: data.email });
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to generate reset link');
    } finally {
      setResettingUid(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeletingUid(deleteTarget.uid);
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.uid}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers((prev) => prev.filter((u) => u.uid !== deleteTarget.uid));
      showToast(`${deleteTarget.name || deleteTarget.email} removed`);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setDeletingUid(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.name?.toLowerCase() ?? '').includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() ?? '').includes(search.toLowerCase())
  );

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    editor: users.filter((u) => u.role === 'editor').length,
    viewer: users.filter((u) => u.role === 'viewer').length,
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Modals */}
      {resetModal && (
        <ResetModal link={resetModal.link} email={resetModal.email} onClose={() => setResetModal(null)} />
      )}
      {deleteTarget && (
        <DeleteModal user={deleteTarget} onConfirm={handleDeleteUser} onClose={() => setDeleteTarget(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-on-surface text-surface px-md py-sm rounded-xl shadow-lg font-body-sm animate-fade-in-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-lg">
        <div className="flex items-center gap-sm mb-xs">
          <span className="material-symbols-outlined text-primary text-[28px]">admin_panel_settings</span>
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Admin Panel</h2>
        </div>
        <p className="font-body-sm text-on-surface-variant">
          Manage users, assign roles, and control access to Lekha Tracker.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        {[
          { label: 'Total Users', value: counts.total, icon: 'group', color: 'text-primary' },
          { label: 'Admins', value: counts.admin, icon: 'shield', color: 'text-error' },
          { label: 'Editors', value: counts.editor, icon: 'edit', color: 'text-primary' },
          { label: 'Viewers', value: counts.viewer, icon: 'visibility', color: 'text-on-surface-variant' },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl border border-outline-variant p-md shadow-sm">
            <div className="flex items-center gap-xs mb-xs">
              <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
              <span className="font-label-sm text-on-surface-variant">{s.label}</span>
            </div>
            <p className={`font-headline-md text-headline-md font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-md mb-md">
        <div className="relative flex-1 max-w-sm">
          <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-surface border border-outline-variant rounded-full pl-xl pr-md py-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-xs px-md py-sm bg-surface border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-sm text-on-surface-variant">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading users…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-sm">
            <span className="material-symbols-outlined text-error text-[36px]">error</span>
            <p className="font-body-md text-error">{error}</p>
            <button onClick={fetchUsers} className="px-md py-sm bg-primary text-on-primary rounded-lg font-label-md mt-sm">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px]">person_off</span>
            <p className="font-body-md">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest">
                  <th className="text-left px-lg py-sm font-label-sm text-on-surface-variant uppercase tracking-wide">User</th>
                  <th className="text-left px-md py-sm font-label-sm text-on-surface-variant uppercase tracking-wide">Role</th>
                  <th className="text-left px-md py-sm font-label-sm text-on-surface-variant uppercase tracking-wide hidden md:table-cell">Provider</th>
                  <th className="text-left px-md py-sm font-label-sm text-on-surface-variant uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  <th className="text-left px-md py-sm font-label-sm text-on-surface-variant uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                  <th className="text-right px-lg py-sm font-label-sm text-on-surface-variant uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filtered.map((user) => (
                  <tr key={user.uid} className={`hover:bg-surface-container-lowest transition-colors ${user.disabled ? 'opacity-50' : ''}`}>
                    {/* User info */}
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                          {initials(user)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-label-md text-on-surface truncate">{user.name || '(No name)'}</p>
                          <p className="font-body-sm text-on-surface-variant truncate">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role selector */}
                    <td className="px-md py-md">
                      <div className="flex items-center gap-xs">
                        <span className={`inline-flex items-center gap-1 px-sm py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[user.role]}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{ROLE_ICONS[user.role]}</span>
                          {user.role}
                        </span>
                        <select
                          value={user.role}
                          disabled={savingRole === user.uid}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                          className="ml-1 bg-surface-container border border-outline-variant rounded-md px-xs py-0.5 text-xs font-label-sm text-on-surface focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                          title="Change role"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        {savingRole === user.uid && (
                          <div className="w-3 h-3 rounded-full border border-primary border-t-transparent animate-spin" />
                        )}
                      </div>
                    </td>

                    {/* Provider */}
                    <td className="px-md py-md hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 font-body-sm text-on-surface-variant capitalize">
                        <span className="material-symbols-outlined text-[14px]">
                          {user.provider === 'google.com' ? 'account_circle' : 'password'}
                        </span>
                        {user.provider === 'google.com' ? 'Google' : 'Email'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-md py-md hidden lg:table-cell font-body-sm text-on-surface-variant">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Last login */}
                    <td className="px-md py-md hidden lg:table-cell font-body-sm text-on-surface-variant">
                      {formatDate(user.lastLoginAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-xs justify-end">
                        {/* Reset password — only for email/password accounts */}
                        <button
                          onClick={() => handleResetPassword(user.uid)}
                          disabled={resettingUid === user.uid || user.provider !== 'password'}
                          title={user.provider !== 'password' ? 'Not applicable for OAuth accounts' : 'Generate password reset link'}
                          className="p-sm rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {resettingUid === user.uid ? (
                            <div className="w-4 h-4 rounded-full border border-primary border-t-transparent animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                          )}
                        </button>

                        {/* Remove user */}
                        <button
                          onClick={() => setDeleteTarget(user)}
                          disabled={deletingUid === user.uid}
                          title="Remove user"
                          className="p-sm rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {deletingUid === user.uid ? (
                            <div className="w-4 h-4 rounded-full border border-error border-t-transparent animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[18px]">person_remove</span>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bootstrap hint */}
      <div className="mt-lg p-md bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-sm">
        <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">info</span>
        <p className="font-body-sm text-on-surface-variant">
          To make a user an admin: use the role dropdown next to their name. To make <em>yourself</em> the first admin, set{' '}
          <code className="bg-surface-container px-1 rounded text-xs">role: &quot;admin&quot;</code> on your user document in the{' '}
          <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Firestore Console
          </a>
          .
        </p>
      </div>
    </div>
  );
}
