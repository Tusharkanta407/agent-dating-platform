"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Brand, Btn, DemoBadge, Modal, PersonCard, ProfileDetail, Avatar } from "@/components/am";
import { PEOPLE, findPerson, type Person } from "@/lib/data";
import { selectRep, startDating, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function Index() {
  const { repId } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [g, setG] = useState<"all" | "female" | "male">("all");
  const [viewing, setViewing] = useState<Person | null>(null);
  const list = useMemo(
    () => PEOPLE.filter((p) => (g === "all" || p.gender === g) && `${p.name} ${p.role} ${p.company}`.toLowerCase().includes(q.toLowerCase())),
    [q, g],
  );
  const rep = repId ? findPerson(repId) : undefined;

  return (
    <div className="min-h-screen pb-32">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8"><Brand /><DemoBadge /></header>
      <section className="mx-auto max-w-7xl px-5 pt-8 text-center sm:px-8">
        <h1 className="text-5xl font-semibold sm:text-7xl">Choose your <em className="text-primary">dating agent</em></h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">Choose the person your AI agent will represent.</p>
      </section>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm font-medium text-muted-foreground">{list.length} profiles</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 sm:w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, role, company" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
          <div className="flex rounded-full border border-border bg-card p-1">
            {(["all", "female", "male"] as const).map((k) => (
              <button key={k} onClick={() => setG(k)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium capitalize transition", g === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {k === "all" ? "All" : k === "female" ? "Women" : "Men"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-2 gap-4 px-5 sm:gap-6 sm:px-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((p) => (
          <PersonCard key={p.id} p={p} selected={repId === p.id} onSelect={() => selectRep(p.id)} onView={() => setViewing(p)}
            footer={<span className="inline-flex rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">Profile ready</span>} />
        ))}
        {list.length === 0 && <p className="col-span-full py-20 text-center text-muted-foreground">No profiles match your search.</p>}
      </div>

      {rep && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 animate-rise">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 rounded-full border border-border bg-card/95 py-2 pl-2 pr-2 shadow-[var(--shadow-elegant)] backdrop-blur">
            <div className="flex items-center gap-3">
              <Avatar p={rep} size={44} />
              <div className="leading-tight"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Your agent represents</p><p className="font-serif text-xl font-semibold">{rep.name}</p></div>
            </div>
            <Btn onClick={() => { startDating(); router.push("/board"); }}>Start Dating <ArrowRight className="h-4 w-4" /></Btn>
          </div>
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)}>{viewing && <ProfileDetail p={viewing} onClose={() => setViewing(null)} />}</Modal>
    </div>
  );
}
