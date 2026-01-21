"use client";

import AuthGate, { useAuth } from "@/components/AuthGate";
import { uploadComic } from "@/lib/comics";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

type Comic = { id: string; title: string; visibility: string; downloadURL: string; createdAt?: any };

export default function MyComicsPage() {
  return (
    <AuthGate fallback={<main className="container"><div className="card">Sign in to upload comics.</div></main>}>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"private"|"friends"|"public">("friends");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string|null>(null);
  const [info, setInfo] = useState<string|null>(null);
  const [comics, setComics] = useState<Comic[]>([]);

  async function refresh() {
    if (!user) return;
    const q1 = query(collection(db,"comics"), where("ownerUid","==",user.uid), orderBy("createdAt","desc"));
    const snap = await getDocs(q1);
    setComics(snap.docs.map(d=>({ id:d.id, ...(d.data() as any)})));
  }

  useEffect(()=>{ refresh(); }, [user]);

  async function submit() {
    setErr(null); setInfo(null);
    if (!user) return;
    if (!file) { setErr("Pick a CBZ/CBR file."); return; }
    if (!title.trim()) { setErr("Add a title."); return; }

    setBusy(true);
    try {
      await uploadComic({ uid: user.uid, file, title: title.trim(), visibility });
      setInfo("Uploaded! 🎉");
      setTitle(""); setFile(null);
      await refresh();
    } catch(e:any) {
      setErr(e?.message ?? "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <div className="card">
        <h2 style={{marginTop:0}}>My Comics</h2>
        <p className="small">Upload CBZ/CBR you legally own. These uploads are stored in Firebase Storage and opened via kthoom.</p>

        <div className="card">
          <h3 style={{marginTop:0}}>Upload</h3>
          <div className="row">
            <div>
              <label>Title</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Star Wars (2025) #1" />
            </div>
            <div>
              <label>Visibility</label>
              <select value={visibility} onChange={(e)=>setVisibility(e.target.value as any)}>
                <option value="friends">Friends</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <div className="small">UI respects visibility; Storage reads are auth-gated (see README).</div>
            </div>
          </div>
          <div style={{marginTop:10}}>
            <label>CBZ/CBR file</label>
            <input type="file" accept=".cbz,.cbr" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
          </div>
          {err && <p style={{color:"tomato"}}>{err}</p>}
          {info && <p style={{color:"limegreen"}}>{info}</p>}
          <button className="primary" onClick={submit} disabled={busy}>{busy ? "Uploading…" : "Upload"}</button>
        </div>

        <div className="card" style={{marginTop:12}}>
          <h3 style={{marginTop:0}}>Your library</h3>
          {comics.length===0 ? <p className="small">No uploads yet.</p> : (
            <ul>
              {comics.map(c=> (
                <li key={c.id} style={{marginBottom:8}}>
                  <b>{c.title}</b> <span className="badge">{c.visibility}</span>{" "}
                  <Link href={`/reader?comicId=${encodeURIComponent(c.id)}`}>Read</Link>{" "}
                  <span className="small">• share: <code style={{opacity:.8}}>/reader?comicId={c.id}</code></span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card" style={{marginTop:12}}>
          <h3 style={{marginTop:0}}>Read from local disk</h3>
          <p className="small">kthoom can open local files too. Use the reader’s “Open” button.</p>
          <Link href="/reader">Open the reader</Link>
        </div>
      </div>
    </main>
  );
}
