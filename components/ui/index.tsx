// ═══════════════════════════════════════════════════════════
// UI Components — ProPanas 2026 Design System
// ═══════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { useState } from 'react';

// ─── Card ────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: 'none' | 'success' | 'info' | 'danger' | 'warning';
}

export function Card({ children, className = '', onClick, accent = 'none' }: CardProps) {
  const accentColors = {
    none: 'border-l-pp-border',
    success: 'border-l-pp-success',
    info: 'border-l-pp-info',
    danger: 'border-l-pp-danger',
    warning: 'border-l-pp-warning',
  };

  return (
    <div
      className={`
        bg-pp-bg-card border border-pp-border rounded-lg p-4 shadow-card
        border-l-[3px] ${accentColors[accent]}
        ${onClick ? 'cursor-pointer hover:bg-pp-bg-hover hover:border-pp-border-light transition-all duration-150' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Button ──────────────────────────────────────────────

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children, variant = 'primary', size = 'md', disabled, loading, onClick, className = '', type = 'button',
}: ButtonProps) {
  const variants = {
    primary: 'bg-gradient-to-br from-pp-gold to-pp-gold-dim text-pp-navy-deep font-bold hover:brightness-110 shadow-gold',
    secondary: 'bg-transparent border-[1.5px] border-pp-gold text-pp-gold hover:bg-pp-gold/10',
    danger: 'bg-pp-danger text-white hover:brightness-90',
    ghost: 'bg-transparent text-pp-text-secondary hover:text-pp-text hover:bg-pp-bg-surface',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-6 py-3 text-sm rounded-lg',
    lg: 'px-8 py-3.5 text-base rounded-lg',
  };

  return (
    <button
      type={type}
      className={`
        inline-flex items-center justify-center font-semibold transition-all duration-150
        ${variants[variant]} ${sizes[size]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}

// ─── Badge ───────────────────────────────────────────────

interface BadgeProps {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'muted';
  children: React.ReactNode;
  pulse?: boolean;
}

export function Badge({ variant, children, pulse }: BadgeProps) {
  return (
    <span className={`pill pill-${variant} ${pulse ? 'animate-pulse-slow' : ''}`}>
      {children}
    </span>
  );
}

// ─── ScoreInput ──────────────────────────────────────────

interface ScoreInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  disabled?: boolean;
  locked?: boolean;
}

export function ScoreInput({ value, onChange, disabled, locked }: ScoreInputProps) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      className={`score-input ${locked ? 'opacity-40 cursor-not-allowed' : ''} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, '');
        onChange(v === '' ? null : parseInt(v));
      }}
      onKeyDown={(e) => {
        if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
          e.preventDefault();
        }
      }}
      onPaste={(e) => {
        const paste = e.clipboardData.getData('text');
        if (!/^\d{1,2}$/.test(paste)) e.preventDefault();
      }}
      disabled={disabled || locked}
      placeholder="–"
    />
  );
}

// ─── MatchCard ───────────────────────────────────────────

interface MatchCardProps {
  matchNumber: number;
  homeTeam: { name: string; flag: string };
  awayTeam: { name: string; flag: string };
  homeGoals: number | null;
  awayGoals: number | null;
  onHomeChange: (v: number | null) => void;
  onAwayChange: (v: number | null) => void;
  status: 'pending' | 'completed' | 'official' | 'invalidated' | 'locked';
  date?: string;
  venue?: string;
  officialScore?: { home: number; away: number } | null;
  pointsAwarded?: number;
}

export function MatchCard({
  matchNumber, homeTeam, awayTeam, homeGoals, awayGoals,
  onHomeChange, onAwayChange, status, date, venue,
  officialScore, pointsAwarded,
}: MatchCardProps) {
  const accent = status === 'completed' ? 'success' : status === 'official' ? 'info'
    : status === 'invalidated' ? 'danger' : 'none';
  const isLocked = status === 'locked' || status === 'invalidated';

  return (
    <Card accent={accent} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-pp-text-muted">M{matchNumber}</span>
        {date && <span className="text-[10px] text-pp-text-muted">{date}</span>}
        {status === 'invalidated' && <Badge variant="danger">Invalidado</Badge>}
        {status === 'locked' && <Badge variant="muted">Cerrado</Badge>}
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold truncate">{homeTeam.name}</span>
          <span className="text-lg">{homeTeam.flag}</span>
        </div>

        <ScoreInput value={homeGoals} onChange={onHomeChange} locked={isLocked} />
        <span className="text-pp-text-muted text-xs font-bold">VS</span>
        <ScoreInput value={awayGoals} onChange={onAwayChange} locked={isLocked} />

        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{awayTeam.flag}</span>
          <span className="text-sm font-semibold truncate">{awayTeam.name}</span>
        </div>
      </div>

      {officialScore && (
        <div className="flex items-center justify-between pt-2 border-t border-pp-border/20">
          <span className="text-[10px] text-pp-info">
            Resultado: {officialScore.home} - {officialScore.away}
          </span>
          {pointsAwarded != null && (
            <span className="text-xs font-bold text-pp-gold">+{pointsAwarded} pts</span>
          )}
        </div>
      )}

      {venue && <div className="text-[9px] text-pp-text-muted">{venue}</div>}
    </Card>
  );
}

// ─── RankRow ─────────────────────────────────────────────

interface RankRowProps {
  position: number;
  name: string;
  points: number;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

export function RankRow({ position, name, points, isCurrentUser, onClick }: RankRowProps) {
  const badgeClass = position === 1 ? 'rank-1' : position === 2 ? 'rank-2'
    : position === 3 ? 'rank-3' : 'bg-pp-bg-surface text-pp-text-muted';

  return (
    <Card
      accent="none"
      onClick={onClick}
      className={`flex items-center gap-3.5 py-3 ${isCurrentUser ? '!bg-pp-gold/[0.06] !border-pp-gold/30' : ''}`}
    >
      <div className={`rank-badge ${badgeClass}`}>{position}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm truncate ${isCurrentUser ? 'font-bold' : 'font-medium'}`}>
          {name}{isCurrentUser ? ' (Tú)' : ''}
        </div>
      </div>
      <div className="text-lg font-black text-pp-gold">{points}</div>
      {isCurrentUser && <span className="text-lg">👑</span>}
    </Card>
  );
}

// ─── Group Pill Selector ─────────────────────────────────

interface GroupSelectorProps {
  groups: string[];
  selected: string;
  onSelect: (g: string) => void;
  completion?: Record<string, boolean>;
  allGroupsComplete?: boolean;
}
export function GroupSelector({ groups, selected, onSelect, completion, allGroupsComplete }: GroupSelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
      {groups.map((g, index) => {
        const isComplete = completion?.[g] ?? false;
        const prevGroup = index > 0 ? groups[index - 1] : null;
        const prevComplete = prevGroup ? (completion?.[prevGroup] ?? false) : true;
        const isEnabled = allGroupsComplete || index === 0 || prevComplete || isComplete;

        return (
          <button
            key={g}
            onClick={() => isEnabled && onSelect(g)}
            disabled={!isEnabled}
            className={`
              flex-shrink-0 w-10 h-10 rounded-md text-sm font-bold transition-all duration-150
              ${!isEnabled
                ? 'bg-pp-bg-surface/50 text-pp-text-muted/30 border border-pp-border/20 cursor-not-allowed'
                : selected === g
                  ? 'bg-pp-maroon text-pp-gold border border-pp-gold/30'
                  : 'bg-pp-bg-surface text-pp-text-secondary border border-pp-border hover:border-pp-border-light'}
              ${isComplete ? 'ring-1 ring-pp-success/40' : ''}
            `}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}

// ─── StandingsTable ──────────────────────────────────────

interface StandingsRow {
  teamName: string; flag: string; pos: number;
  jj: number; jg: number; je: number; jp: number;
  gf: number; gc: number; gd: number; pts: number;
}

export function StandingsTable({ rows }: { rows: StandingsRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-pp-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-pp-bg-surface text-pp-gold-light text-[10px] font-bold tracking-wider">
            <th className="sticky left-0 bg-pp-bg-surface px-3 py-2 text-left">#</th>
            <th className="sticky left-8 bg-pp-bg-surface px-2 py-2 text-left">Equipo</th>
            <th className="px-2 py-2 text-center">JJ</th>
            <th className="px-2 py-2 text-center">JG</th>
            <th className="px-2 py-2 text-center">JE</th>
            <th className="px-2 py-2 text-center">JP</th>
            <th className="px-2 py-2 text-center">GF</th>
            <th className="px-2 py-2 text-center">GC</th>
            <th className="px-2 py-2 text-center">GD</th>
            <th className="px-2 py-2 text-center font-black text-pp-gold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.pos} className="border-b border-pp-border/15">
              <td className={`sticky left-0 bg-pp-bg-card px-3 py-2 font-bold
                ${r.pos <= 2 ? 'text-pp-success' : r.pos === 3 ? 'text-pp-warning' : 'text-pp-text-muted'}`}>
                {r.pos}
              </td>
              <td className="sticky left-8 bg-pp-bg-card px-2 py-2">
                <span className="mr-1.5">{r.flag}</span>
                <span className="font-medium">{r.teamName}</span>
              </td>
              <td className="px-2 py-2 text-center text-pp-text-secondary">{r.jj}</td>
              <td className="px-2 py-2 text-center text-pp-text-secondary">{r.jg}</td>
              <td className="px-2 py-2 text-center text-pp-text-secondary">{r.je}</td>
              <td className="px-2 py-2 text-center text-pp-text-secondary">{r.jp}</td>
              <td className="px-2 py-2 text-center">{r.gf}</td>
              <td className="px-2 py-2 text-center">{r.gc}</td>
              <td className="px-2 py-2 text-center font-medium">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="px-2 py-2 text-center font-black text-pp-gold text-sm">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Hero Card ───────────────────────────────────────────

interface HeroCardProps {
  position: number | null;
  points: number;
  completion: number;
  nextMatch?: string;
}

export function HeroCard({ position, points, completion, nextMatch }: HeroCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-pp-gold/20 p-6"
      style={{ background: 'linear-gradient(150deg, rgba(107,29,42,0.88), rgba(8,12,24,1) 70%)' }}>
      <div className="relative z-10 text-center space-y-3">
        <div className="text-[10px] text-pp-gold-light tracking-[3px] uppercase">Tu posición</div>
        <div className="text-5xl font-black text-pp-gold">{position ?? '–'}°</div>
        <div className="text-lg font-bold">
          {points} <span className="text-xs font-normal text-pp-text-secondary">puntos</span>
        </div>
        <div className="w-full bg-pp-border rounded-full h-2 mt-4">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${completion}%`,
              background: 'linear-gradient(90deg, #C9A84C, #6B1D2A)',
              boxShadow: '0 0 12px rgba(201,168,76,0.3)',
            }}
          />
        </div>
        <div className="text-[11px] text-pp-text-muted">{completion}% completado</div>
      </div>
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Sidebar (Desktop) ───────────────────────────────────

interface NavItem {
  label: string; href: string; icon: string; active?: boolean; disabled?: boolean;
}

export function Sidebar({ items, userName, role, onLogout }: { items: NavItem[]; userName: string; role: string; onLogout?: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-pp-navy border-r border-pp-border h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-pp-border/50 flex justify-center">
        <img
          src="/logo-sidebar.png"
          alt="ProPanas 2026"
          className="h-16 w-auto object-contain"
        />
      </div>
      {/* Nav items */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {items.map(item => (
          item.disabled ? (
            <span
              key={item.href}
              className="flex items-center gap-3 px-5 py-2.5 text-sm opacity-30 cursor-not-allowed"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </span>
          ) : (
            <a
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-150
                ${item.active
                  ? 'bg-pp-maroon/20 text-pp-gold border-l-2 border-pp-gold font-semibold'
                  : 'text-pp-text-secondary hover:text-pp-text hover:bg-pp-bg-hover/50'}
              `}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          )
        ))}
      </nav>
      {/* User + logout menu */}
      <div className="relative">
        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 mx-3 bg-pp-bg-card border border-pp-border rounded-lg shadow-modal overflow-hidden">
            <a href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-pp-text-secondary hover:bg-pp-bg-hover hover:text-pp-text transition-colors">
              <span>👤</span> Mi perfil
            </a>
            <button
              onClick={() => { setShowMenu(false); onLogout?.(); }}
              className="flex items-center gap-2 px-4 py-3 text-sm text-pp-danger hover:bg-pp-danger/10 w-full text-left transition-colors border-t border-pp-border/30"
            >
              <span>🚪</span> Cerrar sesión
            </button>
          </div>
        )}
        <div
          onClick={() => setShowMenu(!showMenu)}
          className="p-4 border-t border-pp-border/50 flex items-center gap-3 cursor-pointer hover:bg-pp-bg-hover/50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-pp-maroon flex items-center justify-center text-xs font-bold text-pp-gold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{userName}</div>
            <div className="text-[10px] text-pp-text-muted">{role}</div>
          </div>
          <span className={`text-[10px] text-pp-text-muted transition-transform ${showMenu ? 'rotate-180' : ''}`}>▲</span>
        </div>
      </div>
    </aside>
  );
}

// ─── Bottom Nav (Mobile) ─────────────────────────────────

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-pp-navy/95 backdrop-blur-md border-t border-pp-border z-50 safe-area-pb">
      <div className="flex justify-around py-1.5">
        {items.slice(0, 5).map(item => (
          item.disabled ? (
            <span
              key={item.href}
              className="flex flex-col items-center py-1.5 px-3 min-w-[56px] opacity-30 cursor-not-allowed"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-semibold mt-0.5">{item.label}</span>
            </span>
          ) : (
            <a
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 min-w-[56px]
                ${item.active
                  ? 'text-pp-gold border-t-2 border-pp-gold -mt-[2px]'
                  : 'text-pp-text-muted'}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px] font-semibold mt-0.5">{item.label}</span>
            </a>
          )
        ))}
      </div>
    </nav>
  );
}

// ─── Page Header ─────────────────────────────────────────

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-pp-gold-light tracking-wide">{title}</h1>
      {subtitle && <p className="text-xs text-pp-text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Cascade Confirm Modal ───────────────────────────────

interface CascadeModalProps {
  affectedSlots: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function CascadeModal({ affectedSlots, onConfirm, onCancel }: CascadeModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-pp-bg-surface border border-pp-warning/30 rounded-xl p-6 max-w-md w-full shadow-modal space-y-4">
        <div className="text-pp-warning font-bold text-lg">⚠ Cascada de cambios</div>
        <p className="text-sm text-pp-text-secondary">
          Este cambio invalidará <strong className="text-pp-text">{affectedSlots.length}</strong> pronósticos de eliminatoria:
        </p>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {affectedSlots.map(s => (
            <div key={s} className="text-xs text-pp-danger font-mono bg-pp-danger-dim/30 px-3 py-1 rounded">
              {s}
            </div>
          ))}
        </div>
        <p className="text-xs text-pp-text-muted">
          Tendrás que recargar estos pronósticos después del cambio.
        </p>
        <div className="flex gap-3 pt-2">
          <Button variant="ghost" onClick={onCancel} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">Confirmar cambio</Button>
        </div>
      </div>
    </div>
  );
}
