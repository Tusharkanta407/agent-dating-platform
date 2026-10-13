"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Pause, Play, RotateCw, Trophy } from "lucide-react";
import { useState } from "react";
import { Avatar, Brand, Btn, DemoBadge, Modal, PersonCard, ProfileDetail, StatusPill, Tag } from "@/components/am";
import { candidatesFor, findPerson, type Person } from "@/lib/data";
import { retryDate, startDating, stopDating, useStore } from "@/lib/store";

export default function Board() {
  const { repId, dates, running } = useStore();
  const router = useRouter();
  const [viewing, setViewing] = useState<Person | null>(null);
  const rep = repId ? findPerson(repId) : undefined;

  if (!rep) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <Heart className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-4xl font-semibold">No representative selected</h1>
          <p className="mt-2 text-muted-foreground">Pick a person for your AI agent to represent first.</p>
          <Link href="/" className="mt-6 inline-flex"><Btn>Choose an agent</Btn></Link>
        </div>
      </div>
    );
  }

  const cands = candidatesFor(rep);
  const done = cands.filter((c) => dates[c.id]?.status === "completed").length;
  const allDone = done === cands.length;

  return (
    <div className="min-h-screen pb-20">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8"><Brand /><DemoBadge /></header>
      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Change agent</Link>
        <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <Avatar p={rep} size={72} />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Representing {rep.name}</p>
              <h1 className="text-4xl font-semibold sm:text-5xl">Your Dating Board</h1>
              <p className="mt-1 text-muted-foreground">Explore potential connections through AI-powered conversations.</p>
            </div>
          </div>
          <div className="w-full space-y-3 lg:w-80">
            <div className="flex justify-between text-sm"><span className="font-semibold">{done} of {cands.length} dates completed</span><span className="text-muted-foreground">{Math.round((done / cands.length) * 100)}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(done / cands.length) * 100}%` }} /></div>
            <div className="flex gap-2">
              {allDone ? (
                <Btn className="flex-1" onClick={() => router.push("/rankings")}><Trophy className="h-4 w-4" />See your best matches</Btn>
              ) : running ? (
                <Btn variant="outline" className="flex-1" onClick={stopDating}><Pause className="h-4 w-4" />Pause</Btn>
              ) : (
                <Btn className="flex-1" onClick={startDating}><Play className="h-4 w-4" />{done ? "Resume Dating" : "Start Dating"}</Btn>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-7xl grid-cols-1 gap-6 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:grid-cols-4">
        {cands.map((c) => {
          const d = dates[c.id];
          const status = d?.status ?? "not_started";
          return (
            <PersonCard key={c.id} p={c} highlight={status === "in_progress"} onView={() => setViewing(c)}
              footer={
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><StatusPill status={status} />{d?.score != null && <span className="font-serif text-2xl font-semibold text-primary">{d.score}%</span>}</div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                  <div className="flex flex-wrap gap-1.5">{c.interests.slice(0, 3).map((i) => <Tag key={i}>{i}</Tag>)}</div>
                  {status === "failed" && <p className="text-xs text-destructive">{d?.error ?? "Date failed."}</p>}
                  <div className="flex gap-2">
                    {(status === "in_progress" || status === "completed") && (
                      <Link href={`/date/${c.id}`} className="flex-1"><Btn variant="soft" className="w-full py-2"><MessageCircle className="h-4 w-4" />{status === "completed" ? "Conversation" : "Watch live"}</Btn></Link>
                    )}
                    {status === "failed" && <Btn variant="soft" className="flex-1 py-2" onClick={() => retryDate(c.id)}><RotateCw className="h-4 w-4" />Retry</Btn>}
                  </div>
                </div>
              } />
          );
        })}
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)}>{viewing && <ProfileDetail p={viewing} onClose={() => setViewing(null)} backLabel="Back to Dating Board" />}</Modal>
    </div>
  );
}
