"use client";

import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthGate from "@/components/AuthGate";

const KTHOOM_URL = "https://codedread.github.io/kthoom/index.html";

export default function ReaderPage() {
  return (
    <AuthGate fallback={<main className="container"><div className="card">Sign in to use the reader.</div></main>}>
      <Inner />
    </AuthGate>
  );
}

function Inner() {
  const sp = useSearchParams();
  const comicId = sp.get("comicId");
  const [title, setTitle] = useState<string>("kthoom reader");
  const [bookUrl, setBookUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setErr(null);
      if (!comicId) { setBookUrl(null); setTitle("kthoom reader"); return; }
      try {
        const snap = await getDoc(doc(db, "comics", comicId));
        if (!snap.exists()) throw new Error("Comic not found.");
        const c = snap.data() as any;
        setTitle(c.title ?? "Comic");
        const objectKey = c.objectKey as string | undefined;
        if (!objectKey) throw new Error("Comic missing object key.");

        const user = auth.currentUser;
        if (!user) throw new Error("Sign in first.");
        const token = await user.getIdToken();
        const resp = await fetch(`/api/b2/presign-download?objectKey=${encodeURIComponent(objectKey)}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const j = await resp.json();
        if (!resp.ok) throw new Error(j?.error ?? "Failed to get reader URL");
        setBookUrl(j.url ?? null);
      } catch (e:any) {
        setErr(e?.message ?? "Failed to load comic.");
      }
    })();
  }, [comicId]);

  const iframeSrc = useMemo(() => {
    if (!bookUrl) return KTHOOM_URL;
    const u = new URL(KTHOOM_URL);
    u.searchParams.set("bookUri", bookUrl);
    return u.toString();
  }, [bookUrl]);

  return (
    <main className="container">
      <div className="card">
        <h2 style={{marginTop:0}}>Reader</h2>
        <p className="small">
          If you came here without a comicId, use kthoom’s Open button to load a local CBZ/CBR.
        </p>
        {err && <p style={{color:"tomato"}}>{err}</p>}
        <div className="card" style={{padding:0, overflow:"hidden"}}>
          <div className="small" style={{padding:"10px 12px"}}><b>{title}</b></div>
          <iframe
            title="kthoom"
            src={iframeSrc}
            style={{width:"100%", height:"75vh", border:0}}
            sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
          />
        </div>
      </div>
    </main>
  );
}
