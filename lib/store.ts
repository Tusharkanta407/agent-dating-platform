"use client";

import { useEffect, useSyncExternalStore } from "react";

export type DateStatus = "not_started" | "in_progress" | "completed" | "failed";
export interface Message { speaker: "rep" | "cand"; text: string }
export interface DateResult {
  status: DateStatus;
  messages: Message[];
  score?: number;
  shared?: string[];
  differences?: string[];
  explanation?: string;
  error?: string | undefined;
}
interface State { repId: string | null; dates: Record<string, DateResult>; running: boolean }

type DateEvent =
  | { type: "start"; candidateId: string }
  | { type: "message"; candidateId: string; speaker: "rep" | "cand"; text: string }
  | { type: "result"; candidateId: string; score: number; shared: string[]; differences: string[]; explanation: string }
  | { type: "error"; candidateId: string | null; message: string }
  | { type: "progress"; done: number; total: number };

const KEY = "agentmatch-rep";
let state: State = { repId: null, dates: {}, running: false };
const listeners = new Set<() => void>();
let loaded = false;

function emit() { listeners.forEach((l) => l()); }
function set(patch: Partial<State>) { state = { ...state, ...patch }; emit(); }
function setDate(id: string, d: Partial<DateResult>) {
  set({ dates: { ...state.dates, [id]: { ...(state.dates[id] ?? { status: "not_started", messages: [] }), ...d } } });
}

async function loadDates(repId: string) {
  const response = await fetch(`/api/dates?repId=${encodeURIComponent(repId)}`, { cache: "no-store" });
  if (!response.ok) return;
  const { dates } = (await response.json()) as { dates: Record<string, DateResult> };
  if (state.repId === repId) set({ dates });
}

export function useStore() {
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    const repId = localStorage.getItem(KEY);
    if (repId) {
      set({ repId });
      void loadDates(repId);
    }
  }, []);
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
}

export function selectRep(id: string) {
  if (state.repId === id) return;
  localStorage.setItem(KEY, id);
  set({ repId: id, dates: {}, running: false });
  void loadDates(id);
}
export function resetAll() {
  localStorage.removeItem(KEY);
  set({ repId: null, dates: {}, running: false });
}

/** Runs one date on the server and applies its streamed events. Returns false when no dates are left. */
async function runNext(repId: string, candidateId?: string): Promise<boolean> {
  const response = await fetch("/api/dates/run-next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repId, candidateId }),
  });
  if (!response.ok || !response.body) {
    if (candidateId) setDate(candidateId, { status: "failed", error: `Request failed (${response.status})` });
    return false;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let started = false;

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim() || state.repId !== repId) continue;
      const event = JSON.parse(line) as DateEvent;
      if (event.type === "start") {
        started = true;
        setDate(event.candidateId, { status: "in_progress", messages: [], error: undefined, score: undefined });
      } else if (event.type === "message") {
        const current = state.dates[event.candidateId]?.messages ?? [];
        setDate(event.candidateId, { messages: [...current, { speaker: event.speaker, text: event.text }] });
      } else if (event.type === "result") {
        setDate(event.candidateId, {
          status: "completed",
          score: event.score,
          shared: event.shared,
          differences: event.differences,
          explanation: event.explanation,
        });
      } else if (event.type === "error") {
        if (event.candidateId) setDate(event.candidateId, { status: "failed", error: event.message });
        else return false;
      }
    }
  }
  return started;
}

export async function startDating() {
  const repId = state.repId;
  if (!repId || state.running) return;
  set({ running: true });
  try {
    while (state.running && state.repId === repId) {
      if (!(await runNext(repId))) break;
    }
  } finally {
    if (state.repId === repId) set({ running: false });
  }
}
export function stopDating() { set({ running: false }); }
export async function retryDate(id: string) {
  if (state.repId) await runNext(state.repId, id);
}
