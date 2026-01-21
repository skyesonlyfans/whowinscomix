"use client";

import AuthGate, { useAuth } from "@/components/AuthGate";
import { addPost, listPosts } from "@/lib/discussion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function DiscussionPage() {
  return (
    <AuthGate fallback={<main className="container"><div className="card">Sign in to discuss.</div></main>}>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const { user } = useAuth();
  const [threadKey, setThreadKey] = useState("lobby");
  const [body, setBody] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const helper = useMemo(() => {
    return `Try thread keys like:\n- lobby\n- battle:seed=12345|A=70|B=644\n- battle:seed=42|A=70,346|B=720,149`;
  }, []);

  async function refresh() {
    setPosts(await listPosts(threadKey));
  }

  useEffect(()=>{ refresh(); }, [threadKey]);

  async function send() {
    if (!user) return;
    if (!body.trim()) return;
    setBusy(true);
    await addPost({ authorUid: user.uid, threadKey, body: body.trim() });
    setBody("");
    await refresh();
    setBusy(false);
  }

  function citeBattleSeed() {
    setBody((b)=> b + (b ? "\n\n" : "") + `🧾 **Cite**: Paste your battle seed + teams (example: \`seed=12345 A=70 B=644\`) so everyone can replay it.`);
  }

  function citeComicLink() {
    setBody((b)=> b + (b ? "\n\n" : "") + `📚 **Comic**: Share a reader link like \`/reader?comicId=...\` (from **My Comics**).`);
  }

  function citeHeroFacts() {
    setBody((b)=> b + (b ? "\n\n" : "") + `🦸 **Hero cite**: Link a hero ID and claim: \`Hero 70 (Batman) combat=... durability=...\` — verify in /heroes.`);
  }

  return (
    <main className="container">
      <div className="card">
        <h2 style={{marginTop:0}}>Discussion</h2>
        <p className="small">
          Debate arena. Use thread keys to organize arguments (by matchup/seed). Share comics you legally own via <Link href="/my-comics">My Comics</Link> and open them in <Link href="/reader">Reader</Link>.
        </p>

        <div className="row">
          <div>
            <label>Thread key</label>
            <input value={threadKey} onChange={(e)=>setThreadKey(e.target.value)} />
            <div className="small" style={{whiteSpace:"pre-wrap"}}>{helper}</div>
          </div>
          <div className="card">
            <h3 style={{marginTop:0}}>Citations</h3>
            <button onClick={citeBattleSeed}>Cite battle seed</button><br/><br/>
            <button onClick={citeHeroFacts}>Cite hero facts</button><br/><br/>
            <button onClick={citeComicLink}>Share comic reader link</button>
          </div>
        </div>

        <div className="card" style={{marginTop:12}}>
          <h3 style={{marginTop:0}}>Post</h3>
          <textarea rows={4} value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Make your case…" />
          <div style={{marginTop:10}}>
            <button className="primary" onClick={send} disabled={busy}>{busy ? "Posting…" : "Post"}</button>
          </div>
        </div>

        <div className="card" style={{marginTop:12}}>
          <h3 style={{marginTop:0}}>Thread</h3>
          {posts.length===0 ? <p className="small">No posts yet.</p> : (
            <div style={{display:"grid", gap:10}}>
              {posts.map(p=> (
                <div key={p.id} className="card">
                  <div className="small"><b>{p.authorUid}</b></div>
                  <div style={{whiteSpace:"pre-wrap"}}>{p.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
