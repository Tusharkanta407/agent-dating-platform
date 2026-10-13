"use client";

import Link from "next/link";
import { Briefcase, Check, Heart, Instagram, Linkedin, Loader2, MapPin, Sparkles, X, HelpCircle, AlertCircle } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import type { Person } from "@/lib/data";
import type { DateResult, DateStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Heart className="h-4 w-4 fill-current" /></span>
      <span className="leading-tight">
        <span className="block font-serif text-2xl font-semibold">AgentMatch</span>
        <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Where AI agents explore compatibility</span>
      </span>
    </Link>
  );
}

export function DemoBadge() {
  return <span className="rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Simulated personas</span>;
}

export function getFallbackAvatar(name: string, w = 200, h = 200) {
  const initials = name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#2e1420"/><text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${Math.round(Math.min(w, h) * 0.38)}" fill="#f295ad">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function Avatar({ p, size = 40, ring }: { p: Person; size?: number; ring?: boolean }) {
  return (
    <img
      src={p.photo}
      alt={p.name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(p.name, size, size);
      }}
      className={cn("rounded-full object-cover shrink-0", ring && "ring-2 ring-card ring-offset-2 ring-offset-primary/30")}
    />
  );
}

export function Btn({ variant = "primary", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "soft" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[var(--shadow-elegant)]",
    outline: "border border-border bg-card hover:border-primary/40 hover:text-primary",
    ghost: "hover:bg-muted",
    soft: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  }[variant];
  return <button {...props} className={cn("inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50", v, className)} />;
}

const statusMap: Record<DateStatus, { label: string; cls: string }> = {
  not_started: { label: "Not started", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", cls: "bg-secondary text-secondary-foreground" },
  completed: { label: "Completed", cls: "bg-success/12 text-success" },
  failed: { label: "Failed", cls: "bg-destructive/10 text-destructive" },
};
export function StatusPill({ status }: { status: DateStatus }) {
  const s = statusMap[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", s.cls)}>
      {status === "in_progress" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "completed" && <Check className="h-3 w-3" />}
      {status === "failed" && <AlertCircle className="h-3 w-3" />}
      {s.label}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{children}</span>;
}

export function PersonCard({ p, selected, onSelect, onView, footer, highlight }: {
  p: Person; selected?: boolean; onSelect?: () => void; onView: () => void; footer?: ReactNode; highlight?: boolean;
}) {
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => onSelect && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-card)] transition duration-300 animate-rise",
        onSelect && "cursor-pointer hover:-translate-y-1",
        selected ? "border-primary ring-2 ring-primary/25 shadow-[var(--shadow-elegant)]" : "border-border",
        highlight && "border-primary bg-accent ring-2 ring-primary/20",
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={p.photo}
          alt={p.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(p.name, 400, 500);
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/0 to-transparent" />
        {selected && (
          <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground animate-rise"><Check className="h-4 w-4" /></span>
        )}
        {highlight && (
          <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-primary/20"><div className="h-full w-1/3 bg-primary animate-shimmer" /></div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
          <h3 className="text-2xl font-semibold leading-none">{p.name}</h3>
          <p className="mt-1 text-xs opacity-85">{p.role} · {p.company}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        {footer}
        <Btn variant="outline" className="w-full py-2" onClick={(e) => { e.stopPropagation(); onView(); }}>View Profile</Btn>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-background shadow-2xl animate-rise sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <button aria-label="Close" onClick={onClose} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-card/90 shadow"><X className="h-4 w-4" /></button>
        {children}
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h4 className="mb-3 flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.14em] text-primary">{icon}{title}</h4>
      {children}
    </div>
  );
}

export function ProfileDetail({ p, onClose, backLabel = "Back" }: { p: Person; onClose: () => void; backLabel?: string }) {
  return (
    <div>
      <div className="grid gap-0 sm:grid-cols-[260px_1fr]">
        <img
          src={p.photo}
          alt={p.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(p.name, 400, 500);
          }}
          className="aspect-[4/5] h-full w-full object-cover sm:rounded-tl-3xl"
        />
        <div className="flex flex-col justify-end p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Profile</p>
          <h2 className="mt-2 text-4xl font-semibold">{p.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Briefcase className="h-4 w-4" />{p.role} · {p.company}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{p.details[0]?.value}</p>
          <p className="mt-4 text-[15px] leading-relaxed">{p.summary}</p>
          <div className="mt-5 flex gap-2">
            <a href={p.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:text-primary"><Linkedin className="h-4 w-4" />LinkedIn</a>
            <a href={p.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:text-primary"><Instagram className="h-4 w-4" />Instagram</a>
          </div>
        </div>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        <Section icon={<Sparkles className="h-3.5 w-3.5" />} title="Hobbies & interests">
          <div className="flex flex-wrap gap-2">{p.interests.map((i) => <Tag key={i}>{i}</Tag>)}</div>
        </Section>
        <Section icon={<Heart className="h-3.5 w-3.5" />} title="Values & lifestyle">
          <div className="flex flex-wrap gap-2">{p.values.map((i) => <Tag key={i}>{i}</Tag>)}</div>
        </Section>
        <Section icon={<Briefcase className="h-3.5 w-3.5" />} title="Personal details">
          <dl className="space-y-1.5 text-sm">{p.details.map((d) => <div key={d.label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{d.label}</dt><dd className="font-medium">{d.value}</dd></div>)}</dl>
        </Section>
        <Section icon={<HelpCircle className="h-3.5 w-3.5" />} title="Unknown or uncertain">
          <ul className="space-y-1 text-sm text-muted-foreground">{p.unknown.map((u) => <li key={u}>{u} — not enough evidence</li>)}</ul>
        </Section>
      </div>
      <div className="px-6 pb-8 sm:px-8"><Btn variant="soft" onClick={onClose}>{backLabel}</Btn></div>
    </div>
  );
}

export function ScoreBar({ value }: { value: number }) {
  return <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700" style={{ width: `${value}%` }} /></div>;
}

export function Disclaimer() {
  return (
    <p className="rounded-2xl border border-border bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
      This is a simulated conversation generated by AI from public-profile-derived information. It is not an authentic conversation or a statement of either person's romantic preferences.
    </p>
  );
}

export function ConversationThread({ rep, cand, date }: { rep: Person; cand: Person; date: DateResult }) {
  const pending = date.status === "in_progress";
  const nextIsRep = date.messages.length % 2 === 0;
  return (
    <div className="space-y-4">
      {date.messages.map((m, i) => {
        const isRep = m.speaker === "rep";
        const who = isRep ? rep : cand;
        return (
          <div key={i} className={cn("flex items-end gap-3 animate-rise", !isRep && "flex-row-reverse")}>
            <Avatar p={who} size={34} />
            <div className={cn("max-w-[78%]", !isRep && "text-right")}>
              <p className="mb-1 text-[11px] font-semibold text-muted-foreground">{who.name.split(" ")[0]}</p>
              <div className={cn("rounded-2xl px-4 py-3 text-left text-[15px] leading-relaxed", isRep ? "rounded-bl-md border border-border bg-card" : "rounded-br-md bg-secondary text-foreground")}>{m.text}</div>
            </div>
          </div>
        );
      })}
      {pending && (
        <div className={cn("flex items-end gap-3", !nextIsRep && "flex-row-reverse")}>
          <Avatar p={nextIsRep ? rep : cand} size={34} />
          <div className="flex gap-1 rounded-2xl border border-border bg-card px-4 py-3">
            {[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: `${d * 0.15}s` }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
