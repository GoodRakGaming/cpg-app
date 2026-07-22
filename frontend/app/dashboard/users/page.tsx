'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, User } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

function NewUserForm({ onCreated, onCancel }: { onCreated: (user: User, tempPassword: string) => void; onCancel: () => void }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSaving(true);
      const response = await apiClient.createUser({
        email,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        role,
        password: password || undefined,
      });
      if (response.success && response.data) {
        onCreated(response.data.user, response.data.temp_password);
      } else {
        setError(response.error?.message || 'Не удалось создать пользователя');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать пользователя');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-4 p-5">
      <h2 className="mb-4 text-sm font-bold text-ink">Новый пользователь</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {error && (
          <div className="rounded-control border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">{error}</div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-muted">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Имя</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Фамилия</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Роль</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              className="w-full rounded-control border border-line bg-surface-1 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
            >
              <option value="user">Сотрудник</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Пароль</label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Оставить пустым — сгенерировать автоматически"
            />
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RevealedPasswordBanner({
  password,
  onDismiss,
}: {
  password: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — user can still select the text manually
    }
  };

  return (
    <Card className="mb-4 border-accent/30 bg-accent-soft p-4">
      <p className="text-sm font-medium text-ink">Временный пароль (показывается один раз):</p>
      <div className="mt-2 flex items-center gap-2">
        <input
          readOnly
          value={password}
          className="w-full rounded-control border border-line bg-surface-1 px-3 py-2 font-mono text-sm text-ink"
          onFocus={(e) => e.target.select()}
        />
        <Button type="button" variant="secondary" className="shrink-0" onClick={handleCopy}>
          {copied ? 'Скопировано' : 'Скопировать'}
        </Button>
      </div>
      <button type="button" onClick={onDismiss} className="mt-2 text-xs font-medium text-accent hover:text-accent-hover">
        Понятно, скрыть
      </button>
    </Card>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const currentUser = authManager.getUser();

  useEffect(() => {
    if (!authManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (currentUser?.role !== 'admin') {
      router.push('/dashboard/proposals');
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search });
      if (response.success && response.data?.users) {
        setUsers(response.data.users);
        setTotal(response.data.pagination.total);
      } else {
        setError(response.error?.message || 'Не удалось загрузить пользователей');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  // Best-effort — точный подсчёт «последнего активного админа» делает backend;
  // здесь мы видим только текущую страницу списка, поэтому блокируем кнопку
  // лишь в очевидном случае, а остальное перекладываем на ответ backend-а.
  const isOnlyVisibleActiveAdmin = (u: User) =>
    u.role === 'admin' &&
    u.is_active !== false &&
    users.filter((x) => x.role === 'admin' && x.is_active !== false).length <= 1;

  const applyUpdate = async (id: string, payload: { is_active?: boolean; role?: string }) => {
    setError('');
    try {
      const response = await apiClient.updateUser(id, payload);
      if (response.success && response.data?.user) {
        setUsers((prev) => prev.map((u) => (u.id === id ? response.data!.user : u)));
      } else {
        setError(response.error?.message || 'Не удалось обновить пользователя');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить пользователя');
    }
  };

  const handleToggleActive = (u: User) => applyUpdate(u.id, { is_active: !(u.is_active !== false) });
  const handleToggleRole = (u: User) => applyUpdate(u.id, { role: u.role === 'admin' ? 'user' : 'admin' });

  const handleResetPassword = async (id: string) => {
    if (!confirm('Сгенерировать новый временный пароль для этого пользователя?')) return;
    setError('');
    try {
      const response = await apiClient.resetUserPassword(id);
      if (response.success && response.data) {
        setRevealedPassword(response.data.temp_password);
      } else {
        setError(response.error?.message || 'Не удалось сбросить пароль');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сбросить пароль');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
        <p className="mt-4 text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Пользователи</h1>
          <p className="mt-1 text-muted">Аккаунты создаёт администратор — публичной регистрации нет</p>
        </div>
        {!showNewUserForm && (
          <Button variant="primary" onClick={() => setShowNewUserForm(true)}>
            + Новый пользователь
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">{error}</div>
      )}

      {revealedPassword && (
        <RevealedPasswordBanner password={revealedPassword} onDismiss={() => setRevealedPassword(null)} />
      )}

      {showNewUserForm && (
        <NewUserForm
          onCancel={() => setShowNewUserForm(false)}
          onCreated={(user, tempPassword) => {
            setShowNewUserForm(false);
            setRevealedPassword(tempPassword);
            fetchUsers();
          }}
        />
      )}

      <div className="mb-4">
        <Input
          placeholder="Поиск по email или имени…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {users.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4 text-4xl">👤</div>
          <p className="text-muted">{search ? 'Ничего не найдено' : 'Пользователей пока нет'}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line bg-surface-0">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Имя</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Роль</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Статус</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Создан</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const isActive = u.is_active !== false;
                const isSelf = u.id === currentUser?.id;
                const blockLastAdmin = isOnlyVisibleActiveAdmin(u);
                return (
                  <tr key={u.id} className="transition-colors hover:bg-surface-0">
                    <td className="px-6 py-4 text-sm font-medium text-ink">
                      {u.email}
                      {isSelf && <span className="ml-2 text-xs text-muted">(вы)</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || <span className="italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink">{u.role === 'admin' ? 'Администратор' : 'Сотрудник'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={isActive ? 'text-ink' : 'text-danger'}>
                        {isActive ? 'Активен' : 'Деактивирован'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-muted">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5"
                          disabled={blockLastAdmin}
                          title={blockLastAdmin ? 'Нельзя убрать последнего администратора' : undefined}
                          onClick={() => handleToggleActive(u)}
                        >
                          {isActive ? 'Деактивировать' : 'Активировать'}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5"
                          disabled={blockLastAdmin}
                          title={blockLastAdmin ? 'Нельзя убрать последнего администратора' : undefined}
                          onClick={() => handleToggleRole(u)}
                        >
                          {u.role === 'admin' ? 'Сделать сотрудником' : 'Сделать админом'}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-1.5"
                          title="Не завершает уже открытые сессии пользователя. Для подозрения на компрометацию аккаунта сначала деактивируйте его."
                          onClick={() => handleResetPassword(u.id)}
                        >
                          Сбросить пароль
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
