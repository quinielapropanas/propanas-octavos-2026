// ═══════════════════════════════════════════════════════════
// Login Page — Supabase Auth wired (definitive)
//
// Modes: login, register, reset
// On success: redirects via router.push (login) or shows toast (register/reset)
// Auth callback URL configured for email confirmation flow.
// ═══════════════════════════════════════════════════════════

'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/clients';
import { Button } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/dashboard';
  const urlError = searchParams?.get('error') ?? '';
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || '');
  const [success, setSuccess] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(true);

  const supabase = createBrowserSupabase();

  useEffect(() => {
    fetch('/api/pool/deadline')
      .then(r => r.json())
      .then(d => setRegistrationOpen(!d.passed))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await fetch('/api/auth/sync', { method: 'POST' });
        const roleRes = await fetch('/api/auth/role');
        const roleData = await roleRes.json();
        if (roleData.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push(redirect);
        }
        router.refresh();
      }

      else if (mode === 'register') {
        // Check deadline before allowing registration
        const deadlineRes = await fetch('/api/pool/deadline');
        const deadlineData = await deadlineRes.json();
        if (deadlineData.passed) {
          setError('El período de registro ha cerrado. El deadline de la quiniela ya pasó.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name, country, city },
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          await fetch('/api/auth/sync', { method: 'POST' });
          router.push(redirect);
          router.refresh();
        } else {
          setSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.');
          setMode('login');
          setPassword('');
        }
      }

      else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/auth/reset-password`,
        });
        if (error) throw error;
        setSuccess('Te enviamos un link de recuperación. Revisa tu correo.');
      }
    } catch (err: any) {
      const msg = err.message || 'Error de autenticación';
      if (msg.includes('Invalid login credentials')) setError('Correo o contraseña incorrectos');
      else if (msg.includes('already registered')) setError('Este correo ya está registrado');
      else if (msg.includes('Password should be')) setError('La contraseña debe tener al menos 6 caracteres');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(circle at 30% 20%, rgba(107,29,42,0.2), #080C18 65%)' }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <div className="inline-block animate-glow">
            <img
              src="/Logo_2026_small.png"
              alt="ProPanas 2026"
              className="w-100 h-56 mx-auto rounded-2xl border-2 border-pp-gold/30 shadow-gold object-cover"
            />
          </div>
        </div>

        <div className="bg-pp-bg-card border border-pp-border rounded-xl p-6 shadow-card">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold">
              {mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}
            </h2>
            <p className="text-xs text-pp-text-muted mt-1">
              {mode === 'login' ? 'Accede a tu quiniela' : mode === 'register' ? 'Únete a la competencia' : 'Te enviaremos un link de recuperación'}
            </p>
          </div>

          {error && (
            <div className="bg-pp-danger-dim/30 border border-pp-danger/20 text-pp-danger text-xs rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-pp-success-dim/30 border border-pp-success/20 text-pp-success text-xs rounded-lg px-3 py-2 mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <InputField label="Nombre" type="text" value={name} onChange={setName}
                  placeholder="Tu nombre como jugador Propanas" required />
                <div>
                  <label className="text-[10px] text-pp-text-secondary font-semibold uppercase tracking-wider">
                    País
                  </label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    required
                    className="w-full mt-1 px-4 py-3 bg-pp-bg-surface border border-pp-border rounded-lg text-sm
                      text-pp-text focus:border-pp-gold focus:outline-none transition-all duration-150"
                  >
                    <option value="">Selecciona tu país</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <InputField label="Ciudad" type="text" value={city} onChange={setCity}
                  placeholder="Tu ciudad" required />
              </>
            )}
            <InputField label="Correo" type="email" value={email} onChange={setEmail}
              placeholder="tu@email.com" required />
            {mode !== 'reset' && (
              <InputField label="Contraseña" type="password" value={password} onChange={setPassword}
                placeholder="Mínimo 6 caracteres" required minLength={6} />
            )}
            <Button type="submit" variant="primary" className="w-full" size="lg" loading={loading}>
              {mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Enviar link'}
            </Button>
          </form>

          <div className="mt-5 text-center space-y-2">
            {mode === 'login' && (
              <>
                <button onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                  className="text-xs text-pp-text-muted hover:text-pp-gold transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
                {registrationOpen && (
                  <div className="text-xs text-pp-text-muted">
                    ¿No tienes cuenta?{' '}
                    <button onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                      className="text-pp-gold font-semibold hover:underline">
                      Regístrate
                    </button>
                  </div>
                )}
              </>
            )}
            {mode !== 'login' && (
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-xs text-pp-gold font-semibold hover:underline">
                ← Volver a iniciar sesión
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-[10px] text-pp-text-muted">por Tama & Bemba</div>
      </div>
    </div>
  );
}

function InputField({ label, type, value, onChange, ...props }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void;
  [key: string]: any;
}) {
  return (
    <div>
      <label className="text-[10px] text-pp-text-secondary font-semibold uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full mt-1 px-4 py-3 bg-pp-bg-surface border border-pp-border rounded-lg text-sm
          text-pp-text placeholder:text-pp-text-muted
          focus:border-pp-gold focus:outline-none focus:shadow-gold
          transition-all duration-150"
        {...props}
      />
    </div>
  );
}

const COUNTRIES = [
  'Afganistán','Albania','Alemania','Andorra','Angola','Antigua y Barbuda','Arabia Saudita','Argelia','Argentina','Armenia',
  'Australia','Austria','Azerbaiyán','Bahamas','Bangladés','Barbados','Baréin','Bélgica','Belice','Benín',
  'Bielorrusia','Birmania','Bolivia','Bosnia y Herzegovina','Botsuana','Brasil','Brunéi','Bulgaria','Burkina Faso','Burundi',
  'Bután','Cabo Verde','Camboya','Camerún','Canadá','Catar','Chad','Chile','China','Chipre',
  'Colombia','Comoras','Corea del Norte','Corea del Sur','Costa de Marfil','Costa Rica','Croacia','Cuba','Curazao','Dinamarca',
  'Dominica','Ecuador','Egipto','El Salvador','Emiratos Árabes Unidos','Eritrea','Eslovaquia','Eslovenia','España','Estados Unidos',
  'Estonia','Etiopía','Filipinas','Finlandia','Fiyi','Francia','Gabón','Gambia','Georgia','Ghana',
  'Granada','Grecia','Guatemala','Guinea','Guinea Ecuatorial','Guinea-Bisáu','Guyana','Haití','Honduras','Hungría',
  'India','Indonesia','Irak','Irán','Irlanda','Islandia','Islas Marshall','Islas Salomón','Israel','Italia',
  'Jamaica','Japón','Jordania','Kazajistán','Kenia','Kirguistán','Kiribati','Kuwait','Laos','Lesoto',
  'Letonia','Líbano','Liberia','Libia','Liechtenstein','Lituania','Luxemburgo','Madagascar','Malasia','Malaui',
  'Maldivas','Malí','Malta','Marruecos','Mauricio','Mauritania','México','Micronesia','Moldavia','Mónaco',
  'Mongolia','Montenegro','Mozambique','Namibia','Nauru','Nepal','Nicaragua','Níger','Nigeria','Noruega',
  'Nueva Zelanda','Omán','Países Bajos','Pakistán','Palaos','Panamá','Papúa Nueva Guinea','Paraguay','Perú','Polonia',
  'Portugal','Reino Unido','República Centroafricana','República Checa','República del Congo','República Democrática del Congo','República Dominicana','Ruanda','Rumanía','Rusia',
  'Samoa','San Cristóbal y Nieves','San Marino','San Vicente y las Granadinas','Santa Lucía','Santo Tomé y Príncipe','Senegal','Serbia','Seychelles','Sierra Leona',
  'Singapur','Siria','Somalia','Sri Lanka','Suazilandia','Sudáfrica','Sudán','Sudán del Sur','Suecia','Suiza',
  'Surinam','Tailandia','Tanzania','Tayikistán','Timor Oriental','Togo','Tonga','Trinidad y Tobago','Túnez','Turkmenistán',
  'Turquía','Tuvalu','Ucrania','Uganda','Uruguay','Uzbekistán','Vanuatu','Venezuela','Vietnam','Yemen',
  'Yibuti','Zambia','Zimbabue',
];

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-pp-bg">
        <div className="text-pp-text-muted text-sm">Cargando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}