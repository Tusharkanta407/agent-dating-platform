"use client";

import Link from "next/link";
import { ArrowLeft, Crown, MessageCircle } from "lucide-react";
import { Avatar, Brand, Btn, DemoBadge, ScoreBar, Tag } from "@/components/am";
import { candidatesFor, findPerson } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Rankings() {
  const { repId, dates } = useStore();
  const rep = repId ? findPerson(repId) : undefined;
  const ranked = (rep ? candidatesFor(rep) : []).filter((c) => dates[c.id]?.status === "completed")
    .map((c) => ({ c, d: dates[c.id]! }))
    .sort((a, b) => (b.d.score ?? 0) - (a.d.score ?? 0));

  return (
    <div className="min-h-screen pb-16">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6"><Brand /><DemoBadge /></header>
      <main className="mx-auto max-w-5xl px-5">
        <Link href="/board" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />View All Profiles</Link>
        <div className="mt-6 flex flex-col items-center text-center">
          {rep && <Avatar p={rep} size={80} />}
          <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">{rep?.name} · {ranked.length} dates completed</p>
          <h1 className="mt-2 text-5xl font-semibold sm:text-6xl">Your Best Matches</h1>
          <p className="mt-3 max-w-lg text-muted-foreground">Ranked by the compatibility score a judge agent assigned after each conversation, weighing shared interests, values and conversational flow.</p>
        </div>

        {ranked.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No rankings available yet — complete some dates first.</p>
            <Link href="/board" className="mt-4 inline-block"><Btn>Go to Dating Board</Btn></Link>
          </div>
        ) : (
          <ol className="mt-10 space-y-4">
            {ranked.map(({ c, d }, i) => (
              <li key={c.id} className={cn("flex flex-col gap-5 rounded-3xl border bg-card p-5 shadow-[var(--shadow-card)] animate-rise sm:flex-row sm:items-center", i < 3 ? "border-primary/30" : "border-border", i === 0 && "bg-accent")} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-4">
                  <span className={cn("w-10 text-center font-serif text-4xl font-semibold", i < 3 ? "text-primary" : "text-muted-foreground")}>{i + 1}</span>
                  <div className="relative">
                    <img
                      src={c.photo}
                      alt={c.name}
                      referrerPolicy="no-referrer"
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                    {i === 0 && <Crown className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-card p-1 text-gold" />}
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <div><h3 className="text-2xl font-semibold leading-none">{c.name}</h3><p className="mt-1 text-xs text-muted-foreground">{c.role} · {c.company}</p></div>
                    <span className="font-serif text-3xl font-semibold text-primary">{d.score}%</span>
                  </div>
                  <ScoreBar value={d.score ?? 0} />
                  <div className="flex flex-wrap gap-1.5">{d.shared?.map((s) => <Tag key={s}>{s}</Tag>)}</div>
                  <p className="text-sm text-muted-foreground">{d.explanation}</p>
                </div>
                <Link href={`/date/${c.id}`}><Btn variant="outline"><MessageCircle className="h-4 w-4" />View Conversation</Btn></Link>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
