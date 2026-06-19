'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/clients';
import { Button } from '@/components/ui';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 30% 20%, rgba(107,29,42,0.2), #080C18 65%)' }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <img src="/Logo_2026_small.png" alt="ProPanas 2026"
            className="w-100 h-56 mx-auto rounded-2xl border-2 border-pp-gold/30 shadow-gold object-cover" />
        </div>

        <div className="bg-pp-bg-card border border-pp-border rounded-xl p-6 shadow-card">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold">Nueva contraseña</h2>
            <p className="text-xs text-pp-text-muted mt-1">Ingresa tu nueva contraseña</p>
          </div>

          {success ? (
            <div className="bg-pp-success-dim/30 border border-pp-success/20 text-pp-success text-sm rounded-lg px-4 py-3 text-center">
              ✓ Contraseña actualizada. Redirigiendo...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-pp-danger-dim/30 border border-pp-danger/20 text-pp-danger text-xs rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="text-[10px] text-pp-text-secondary font-semibold uppercase tracking-wider">
                  Nueva contraseña
                </label>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required minLength={6}
                  className="w-full mt-1 px-4 py-3 bg-pp-bg-surface border border-pp-border rounded-lg text-sm
                    text-pp-text placeholder:text-pp-text-muted focus:border-pp-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-pp-text-secondary font-semibold uppercase tracking-wider">
                  Confirmar contraseña
                </label>
                <input
                  type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  required minLength={6}
                  className="w-full mt-1 px-4 py-3 bg-pp-bg-surface border border-pp-border rounded-lg text-sm
                    text-pp-text placeholder:text-pp-text-muted focus:border-pp-gold focus:outline-none"
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" size="lg" loading={loading}>
                Actualizar contraseña
              </Button>
            </form>
          )}
        </div>
        <div className="text-center mt-6 text-[10px] text-pp-text-muted">por Tama & Bemba</div>
      </div>
    </div>
  );
}