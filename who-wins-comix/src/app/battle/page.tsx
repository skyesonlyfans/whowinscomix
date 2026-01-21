"use client";

import AuthGate from "@/components/AuthGate";
import type { Hero } from "@/lib/hero";
import { simulateBattle } from "@/lib/battle";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

async function fetchHero(id: string): Promise<Hero> {
  const r = await fetch(`/api/superhero/hero/${encodeURIComponent(id)}`);
  const data = await r.json();
  if (data?.response === "error") throw new Error(data?.error ?? "Failed");
  return data as Hero;
}

export default function BattlePage() {
  return (
    <AuthGate fallback={<main className="container"><div className="card">Sign in to battle.</div></main>}>
      <Inner />
    </AuthGate>
  );
}

function HeroPick({ label, value, onChange }: { label: string; value: string; onChange:(v:string)=>void }) {
  return (
    <div>
      <label>{label} (Hero ID)</label>
      <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder="e.g. 70" />
      <div className="small">Tip: find IDs via <Link href="/heroes">Hero search</Link>.</div>
    </div>
  );
}

function Inner() {
  const sp = useSearchParams();
  const pickA = sp.get("pickA");
  const [mode, setMode] = useState<"1v1"|"2v2">("1v1");
  const [a1, setA1] = useState(pickA ?? "");
  const [b1, setB1] = useState("");
  const [a2, setA2] = useState("");
  const [b2, setB2] = useState("");

  const [seed, setSeed] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(()=>{ if (mode==="1v1"){ setA2(""); setB2(""); } }, [mode]);

  async function run() {
    setErr(null);
    setBusy(true);
    setLog([]);
    try {
      const idsA = [a1, mode==="2v2" ? a2 : ""].filter(Boolean);
      const idsB = [b1, mode==="2v2" ? b2 : ""].filter(Boolean);
      if (idsA.length !== idsB.length) throw new Error("Teams must have equal size.");
      if (idsA.length < 1) throw new Error("Pick at least 1 hero per side.");

      const [teamA, teamB] = await Promise.all([
        Promise.all(idsA.map(fetchHero)),
        Promise.all(idsB.map(fetchHero)),
      ]);

      const seedNum = seed.trim() ? parseInt(seed.trim(),10) : undefined;
      const res = simulateBattle({ mode, teamA, teamB, seed: seedNum });

      setLog(res.log);
    } catch (e:any) {
      setErr(e?.message ?? "Battle failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <div className="card">
        <h2 style={{marginTop:0}}>Battle arena</h2>
        <p className="small">Choose heroes by ID. Battles are seeded + narrated for spicy debates.</p>

        <div className="row">
          <div className="card">
            <h3 style={{marginTop:0}}>Mode</h3>
            <select value={mode} onChange={(e)=>setMode(e.target.value as any)}>
              <option value="1v1">1v1 Duel</option>
              <option value="2v2">2v2 Team Battle</option>
            </select>
            <div style={{marginTop:10}}>
              <label>Seed (optional, for reproducible fights)</label>
              <input value={seed} onChange={(e)=>setSeed(e.target.value)} placeholder="e.g. 12345" />
            </div>
          </div>

          <div className="card">
            <h3 style={{marginTop:0}}>Team A</h3>
            <HeroPick label="A1" value={a1} onChange={setA1} />
            {mode==="2v2" ? <div style={{marginTop:10}}><HeroPick label="A2" value={a2} onChange={setA2} /></div> : null}
          </div>

          <div className="card">
            <h3 style={{marginTop:0}}>Team B</h3>
            <HeroPick label="B1" value={b1} onChange={setB1} />
            {mode==="2v2" ? <div style={{marginTop:10}}><HeroPick label="B2" value={b2} onChange={setB2} /></div> : null}
          </div>
        </div>

        {err && <p style={{color:"tomato"}}>{err}</p>}
        <button className="primary" onClick={run} disabled={busy}>{busy ? "Fighting…" : "Run battle"}</button>

        <hr style={{margin:"16px 0"}} />

        <div className="card">
          <h3 style={{marginTop:0}}>Battle log</h3>
          {log.length===0 ? <p className="small">No battle yet.</p> : (
            <div style={{whiteSpace:"pre-wrap", lineHeight:1.45}}>
              {log.join("\n")}
            </div>
          )}
          {log.length ? (
            <p className="small" style={{marginTop:10}}>
              Want to argue it? Paste the seed + teams in <Link href="/discussion">Discussion</Link>.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
