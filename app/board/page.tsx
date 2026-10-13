"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, LayoutGrid, MessageCircle, Pause, Play, RotateCw, Tv2, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar, Brand, Btn, DateTheater, DemoBadge, Modal, PersonCard, ProfileDetail, StatusPill, Tag } from "@/components/am";
import { candidatesFor, findPerson, type Person } from "@/lib/data";
import { retryDate, startDating, stopDating, useStore } from "@/lib/store";

export default function Board() {
  const { repId, dates, running } = useStore();
  const router = useRouter();
  const [viewing, setViewing] = useState<Person | null>(null);
  const [theaterOpen, setTheaterOpen] = useState(false);
  const rep = repId ? findPerson(repId) : undefined;

  const prevRunning = useRef(running);

  // Determine the active candidate (in_progress or last started)
  const cands = rep ? candidatesFor(rep) : [];
  const activeCand = cands.find((c) => dates[c.id]?.status === "in_progress")
    ?? cands.find((c) => dates[c.id]?.status === "not_started" && running)
    ?? cands.find((c) => dates[c.id]?.status === "completed" && running);

  // When dating starts, auto-open theater
  useEffect(() => {
    if (running && !prevRunning.current) {
      setTheaterOpen(true);
    }
    prevRunning.current = running;
  }, [running]);

  // Auto-open theater when an in_progress date appears
  const hasLiveDate = cands.some((c) => dates[c.id]?.status === "in_progress");
  const prevHasLive = useRef(hasLiveDate);
  useEffect(() => {
    if (hasLiveDate && !prevHasLive.current && running) {
      setTheaterOpen(true);
    }
    prevHasLive.current = hasLiveDate;
  }, [hasLiveDate, running]);

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

  const done = cands.filter((c) => dates[c.id]?.status === "completed").length;
  const allDone = done === cands.length;

  // Theater candidate: in_progress wins, else last started, else first candidate
  const theaterCand = cands.find((c) => dates[c.id]?.status === "in_progress")
    ?? cands.slice().reverse().find((c) => dates[c.id]?.status === "completed")
    ?? cands[0];

  const theaterDate = theaterCand ? (dates[theaterCand.id] ?? { status: "not_started" as const, messages: [] }) : null;

  const handleStartDating = () => {
    startDating();
    setTheaterOpen(true);
  };

  return (
    <>
      {/* ── Theater overlay ── */}
      {theaterOpen && theaterCand && theaterDate && (
        <DateTheater
          rep={rep}
          cand={theaterCand}
          date={theaterDate}
          onClose={() => setTheaterOpen(false)}
          done={done}
          total={cands.length}
        />
      )}

      <div className="min-h-screen pb-20">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            {/* Live View toggle — only shown when dating is active or paused mid-run */}
            {(running || done > 0) && (
              <button
                onClick={() => setTheaterOpen(true)}
                className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
              >
                <Tv2 className="h-3.5 w-3.5" />
                {running ? "Watch Live" : "View Last Date"}
              </button>
            )}
            <DemoBadge />
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />Change agent
          </Link>
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
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{done} of {cands.length} dates completed</span>
                <span className="text-muted-foreground">{Math.round((done / cands.length) * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${(done / cands.length) * 100}%` }} />
              </div>
              <div className="flex gap-2">
                {allDone ? (
                  <Btn className="flex-1" onClick={() => router.push("/rankings")}>
                    <Trophy className="h-4 w-4" />See your best matches
                  </Btn>
                ) : running ? (
                  <>
                    <Btn variant="soft" className="flex-1" onClick={() => setTheaterOpen(true)}>
                      <Tv2 className="h-4 w-4" />Watch Live
                    </Btn>
                    <Btn variant="outline" className="flex-1" onClick={stopDating}>
                      <Pause className="h-4 w-4" />Pause
                    </Btn>
                  </>
                ) : (
                  <Btn className="flex-1" onClick={handleStartDating}>
                    <Play className="h-4 w-4" />{done ? "Resume Dating" : "Start Dating"}
                  </Btn>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* View label */}
        <div className="mx-auto mt-6 flex max-w-7xl items-center gap-2 px-5 sm:px-8">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">All Candidates</span>
        </div>

        <div className="mx-auto mt-4 grid max-w-7xl grid-cols-1 gap-6 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3 xl:grid-cols-4">
          {cands.map((c) => {
            const d = dates[c.id];
            const status = d?.status ?? "not_started";
            return (
              <PersonCard key={c.id} p={c} highlight={status === "in_progress"} onView={() => setViewing(c)}
                footer={
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <StatusPill status={status} />
                      {d?.score != null && <span className="font-serif text-2xl font-semibold text-primary">{d.score}%</span>}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{c.summary}</p>
                    <div className="flex flex-wrap gap-1.5">{c.interests.slice(0, 3).map((i) => <Tag key={i}>{i}</Tag>)}</div>
                    {status === "failed" && <p className="text-xs text-destructive">{d?.error ?? "Date failed."}</p>}
                    <div className="flex gap-2">
                      {(status === "in_progress" || status === "completed") && (
                        <button
                          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80"
                          onClick={() => setTheaterOpen(true)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {status === "completed" ? "See Conversation" : "Watch Live"}
                        </button>
                      )}
                      {status === "failed" && (
                        <Btn variant="soft" className="flex-1 py-2" onClick={() => retryDate(c.id)}>
                          <RotateCw className="h-4 w-4" />Retry
                        </Btn>
                      )}
                    </div>
                  </div>
                } />
            );
          })}
        </div>

        <Modal open={!!viewing} onClose={() => setViewing(null)}>
          {viewing && <ProfileDetail p={viewing} onClose={() => setViewing(null)} backLabel="Back to Dating Board" />}
        </Modal>
      </div>
    </>
  );
}
