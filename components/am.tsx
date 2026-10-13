"use client";

import Link from "next/link";
import { Briefcase, Check, Heart, Instagram, Linkedin, Loader2, MapPin, Sparkles, X, HelpCircle, AlertCircle, Cpu, LayoutGrid, Split } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
      This is a simulated conversation generated by AI from public-profile-derived information. It is not an authentic conversation or a statement of either person&#39;s romantic preferences.
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
          <div key={i} className={cn("flex items-end gap-3 animate-msg-in", !isRep && "flex-row-reverse")} style={{ animationDelay: `${i * 30}ms` }}>
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

// ─── Date Theater ──────────────────────────────────────────────────────────────

export function DateTheater({
  rep,
  cand,
  date,
  onClose,
  done,
  total,
}: {
  rep: Person;
  cand: Person;
  date: DateResult;
  onClose: () => void;
  done: number;
  total: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // "Reading" only when not_started AND no messages yet
  // If backend already fired (in_progress but turn=0), stay on reading screen briefly
  // Once messages arrive, jump to chat
  const isReading = date.status === "not_started" || (date.status === "in_progress" && date.messages.length === 0);
  const isLive = date.status === "in_progress" && date.messages.length > 0;
  const isCompleted = date.status === "completed";
  const isFailed = date.status === "failed";
  const turn = date.messages.length;

  // Is the candidate currently typing? (in_progress, last message was from rep)
  const candIsTyping = isLive && date.messages.length > 0 && date.messages[date.messages.length - 1]?.speaker === "rep";

  // Profile peek: auto-open when candidate typing, let user close manually
  const [peekOpen, setPeekOpen] = useState(false);
  // Auto-open peek when candidate starts typing, auto-close when she sends
  const prevCandTyping = useRef(candIsTyping);
  useEffect(() => {
    if (candIsTyping && !prevCandTyping.current) setPeekOpen(true);
    if (!candIsTyping && prevCandTyping.current) setPeekOpen(false);
    prevCandTyping.current = candIsTyping;
  }, [candIsTyping]);

  // Auto-scroll to bottom as messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [date.messages.length]);

  // Prevent body scroll while theater is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Cycle through profile fields during reading phase (0-based index highlight)
  const [scanStep, setScanStep] = useState(0);
  const allFields = [
    ...cand.interests.slice(0, 4),
    ...cand.values.slice(0, 3),
  ];
  useEffect(() => {
    if (!isReading) return;
    const t = setInterval(() => setScanStep((s) => (s + 1) % Math.max(allFields.length, 1)), 900);
    return () => clearInterval(t);
  }, [isReading, allFields.length]);

  const statusLabel = isLive ? "Live Date" : isCompleted ? "Date Completed" : isFailed ? "Date Failed" : "Agent Reading…";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-rise">

      {/* ── Top Bar ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <span className={cn("h-1.5 w-1.5 rounded-full bg-primary", isLive && "animate-pulse")} />
            {statusLabel}
          </span>
          <span className="hidden text-xs text-muted-foreground sm:block">{done} of {total} done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-muted sm:block">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board View
          </button>
        </div>
      </div>

      {/* ── Participant Header ── */}
      <div className="shrink-0 border-b border-border bg-card/50 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {/* Rep */}
          <div className="flex items-center gap-3">
            <div className={cn("rounded-2xl overflow-hidden", isLive && "animate-pulse-ring")}>
              <img src={rep.photo} alt={rep.name} referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(rep.name, 56, 56); }}
                className="h-14 w-14 object-cover" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Agent</p>
              <p className="font-serif text-lg font-semibold leading-tight">{rep.name}</p>
              <p className="text-xs text-muted-foreground">{rep.company}</p>
            </div>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center gap-1">
            <Heart className={cn("h-6 w-6 transition-all duration-500", isLive ? "fill-primary text-primary scale-110" : "text-muted-foreground")} />
            {(isLive || isCompleted) && (
              <p className="text-[10px] font-semibold text-muted-foreground">{isLive ? `Turn ${turn} / 16` : "Finished"}</p>
            )}
            {isReading && <p className="text-[10px] font-semibold text-primary animate-pulse">Scanning profile…</p>}
          </div>

          {/* Cand — tap to toggle peek in chat */}
          <button
            className="flex flex-row-reverse items-center gap-3 text-right focus:outline-none"
            onClick={() => (isLive || isCompleted) && setPeekOpen((o) => !o)}
            title={isLive ? "Tap to see her profile" : undefined}
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img src={cand.photo} alt={cand.name} referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(cand.name, 56, 56); }}
                className="h-14 w-14 object-cover" />
              {isReading && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan" />
                </div>
              )}
              {isLive && (
                <div className="absolute inset-0 flex items-end justify-center pb-1">
                  <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white/90">
                    {peekOpen ? "▼ hide" : "▲ profile"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Candidate</p>
              <p className="font-serif text-lg font-semibold leading-tight">{cand.name}</p>
              <p className="text-xs text-muted-foreground">{cand.company}</p>
            </div>
          </button>
        </div>

        {/* Turn progress bar */}
        {(isLive || isCompleted) && (
          <div className="mx-auto mt-3 max-w-3xl">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-700" style={{ width: `${(turn / 16) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Reading State: Animated profile scan ── */}
      {isReading && (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] animate-rise">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              <Cpu className="h-4 w-4 animate-spin" />
              Agent analyzing profile
            </div>
            {/* Candidate photo + summary side by side */}
            <div className="flex items-start gap-4">
              <div className="relative shrink-0 overflow-hidden rounded-2xl">
                <img src={cand.photo} alt={cand.name} referrerPolicy="no-referrer"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(cand.name, 80, 80); }}
                  className="h-24 w-24 object-cover" />
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-primary/35 to-transparent animate-scan" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-xl font-semibold">{cand.name}</p>
                <p className="mb-2 text-sm text-muted-foreground">{cand.company}</p>
                {/* Auto-cycling field highlights */}
                <div className="space-y-1.5">
                  {allFields.map((field, i) => (
                    <div
                      key={field}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-all duration-500",
                        scanStep === i
                          ? "bg-primary text-primary-foreground shadow-[var(--shadow-elegant)] scale-[1.02]"
                          : "bg-secondary/50 text-secondary-foreground"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", scanStep === i ? "bg-primary-foreground" : "bg-primary/50")} />
                      <span className="truncate">{field}</span>
                      {scanStep === i && <span className="ml-auto shrink-0 text-[9px] font-bold uppercase tracking-wider opacity-70">reading</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-[11px] text-muted-foreground animate-pulse">
              Preparing {rep.name.split(" ")[0]}&apos;s opening message…
            </p>
          </div>
        </div>
      )}

      {/* ── Failed State ── */}
      {isFailed && (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="mt-3 font-semibold">This date failed</p>
            <p className="mt-1 text-sm text-muted-foreground">{date.error ?? "Something went wrong."}</p>
          </div>
        </div>
      )}

      {/* ── Live / Completed Chat ── */}
      {(isLive || isCompleted) && (
        <>
          {/* Profile peek panel — slides down when candidate is typing or user taps her photo */}
          <div className={cn(
            "shrink-0 overflow-hidden transition-all duration-500 ease-in-out border-b border-border bg-secondary/30",
            peekOpen ? "max-h-52" : "max-h-0 border-0"
          )}>
            <div className="flex gap-4 overflow-x-auto px-4 py-3 sm:px-6">
              {/* Small portrait */}
              <img src={cand.photo} alt={cand.name} referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = getFallbackAvatar(cand.name, 56, 112); }}
                className="h-28 w-20 shrink-0 rounded-2xl object-cover" />
              {/* Scrollable info */}
              <div className="flex-1 overflow-y-auto space-y-2 py-0.5 pr-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {candIsTyping ? `${cand.name.split(" ")[0]} is typing… read her profile while you wait` : `${cand.name.split(" ")[0]}'s Profile`}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">{cand.summary}</p>
                <div className="flex flex-wrap gap-1">
                  {[...cand.interests, ...cand.values].map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-2xl space-y-4">
              <ConversationThread rep={rep} cand={cand} date={date} />
            </div>
          </div>
        </>
      )}

      {/* ── Score Reveal (completed) ── */}
      {isCompleted && (
        <div className="shrink-0 border-t border-border bg-card/80 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground animate-score-pop">
                  <span className="font-serif text-2xl font-semibold leading-none">{date.score}%</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Match</span>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">
                    {rep.name.split(" ")[0]} &amp; {cand.name.split(" ")[0]}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{date.explanation}</p>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                {date.shared && date.shared.length > 0 && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                      <Sparkles className="h-3 w-3" /> Shared
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {date.shared.slice(0, 2).map((s) => <Tag key={s}>{s}</Tag>)}
                    </div>
                  </div>
                )}
                {date.differences && date.differences.length > 0 && (
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Split className="h-3 w-3" /> Diff
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {date.differences.slice(0, 1).map((s) => <Tag key={s}>{s}</Tag>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="shrink-0 border-t border-border bg-card/50 px-4 py-2 text-center text-[10px] text-muted-foreground">
        Simulated AI conversation · Not an authentic statement of anyone&apos;s romantic preferences
      </div>
    </div>
  );
}
