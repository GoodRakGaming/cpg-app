'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.changePassword(currentPassword, newPassword);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error?.message || 'Не удалось сменить пароль');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сменить пароль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <Card className="w-full max-w-sm p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-ink">Сменить пароль</h2>

        {success ? (
          <div className="mt-4">
            <p className="text-sm text-ink">Пароль успешно изменён.</p>
            <p className="mt-1 text-xs text-muted">
              Это не завершает другие уже открытые сессии на других устройствах.
            </p>
            <Button type="button" variant="secondary" className="mt-4 w-full" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            {error && (
              <div className="rounded-control border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-muted">Текущий пароль</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Новый пароль</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Подтверждение нового пароля</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
