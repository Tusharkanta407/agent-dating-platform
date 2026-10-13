"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Heart, Sparkles, Split } from "lucide-react";
import { Avatar, Brand, ConversationThread, DemoBadge, Disclaimer, ScoreBar, StatusPill, Tag } from "@/components/am";
import { findPerson } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function DatePage() {
  const { id } = useParams<{ id: string }>();
  const { repId, dates } = useStore();
  const rep = repId ? findPerson(repId) : undefined;
  const cand = findPerson(id);
  const d = dates[id] ?? { status: "not_started" as const, messages: [] };

  if (!rep || !cand) {
    return <div className="grid min-h-screen place-items-center text-center"><div><p className="text-muted-foreground">This date isn't available.</p><Link href="/" className="mt-4 inline-block text-primary underline">Go back</Link></div></div>;
  }
  const turn = Math.min(16, d.messages.length);

  return (
    <div className="min-h-screen pb-16">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6"><Brand /><DemoBadge /></header>
      <main className="mx-auto max-w-4xl space-y-6 px-5">
        <Link href="/board" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Dating board</Link>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-primary">AI Dating Simulation</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3"><Avatar p={rep} size={56} /><div><p className="font-serif text-xl font-semibold leading-tight">{rep.name}</p><p className="text-xs text-muted-foreground">{rep.role}</p></div></div>
            <Heart className="h-5 w-5 shrink-0 fill-primary text-primary" />
            <div className="flex flex-row-reverse items-center gap-3 text-right"><Avatar p={cand} size={56} /><div><p className="font-serif text-xl font-semibold leading-tight">{cand.name}</p><p className="text-xs text-muted-foreground">{cand.role}</p></div></div>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
            <StatusPill status={d.status} />
            <span className="text-xs text-muted-foreground">Conversation · Message {turn} of 16</span>
          </div>
          <div className="mt-3"><ScoreBar value={(turn / 16) * 100} /></div>
        </div>

        <div className="rounded-3xl border border-border bg-background p-4 sm:p-6">
          {d.messages.length === 0 && d.status !== "in_progress" ? (
            <p className="py-12 text-center text-muted-foreground">This date hasn't started yet.</p>
          ) : (
            <ConversationThread rep={rep} cand={cand} date={d} />
          )}
        </div>

        {d.status === "completed" && (
          <div className="grid gap-4 sm:grid-cols-3 animate-rise">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><Sparkles className="h-3.5 w-3.5" />Shared interests</h4>
              <div className="flex flex-wrap gap-1.5">{d.shared?.map((s) => <Tag key={s}>{s}</Tag>)}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary"><Split className="h-3.5 w-3.5" />Potential differences</h4>
              <div className="flex flex-wrap gap-1.5">{d.differences?.length ? d.differences.map((s) => <Tag key={s}>{s}</Tag>) : <span className="text-sm text-muted-foreground">None noted</span>}</div>
            </div>
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-80">Compatibility</p>
              <p className="font-serif text-5xl font-semibold">{d.score}%</p>
            </div>
            <p className="rounded-2xl border border-border bg-card p-5 text-[15px] leading-relaxed sm:col-span-3">{d.explanation}</p>
          </div>
        )}

        <Disclaimer />
      </main>
    </div>
  );
}
