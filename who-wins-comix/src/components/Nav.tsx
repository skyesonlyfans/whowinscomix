"use client";
import Link from "next/link";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { useAuth } from "@/components/AuthGate";

export default function Nav() {
  const { user } = useAuth();
  return (
    <div style={{position:"sticky", top:0, zIndex:50, backdropFilter:"blur(10px)", borderBottom:"1px solid rgba(0,0,0,.12)"}}>
      <div className="container" style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
        <div style={{display:"flex", alignItems:"center", gap:12, flexWrap:"wrap"}}>
          <Link href="/" style={{textDecoration:"none"}}><b>who-wins comix by Skye &lt;3</b></Link>
          <span className="badge">1v1 + 2v2</span>
          <Link href="/heroes">Heroes</Link>
          <Link href="/battle">Battle</Link>
          <Link href="/friends">Friends</Link>
          <Link href="/my-comics">My Comics</Link>
          <Link href="/discussion">Discussion</Link>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          {user ? (
            <>
              <Link href="/me">Me</Link>
              <button onClick={() => signOut(auth)}>Sign out</button>
            </>
          ) : (
            <button className="primary" onClick={() => signInWithPopup(auth, googleProvider)}>Sign in with Google</button>
          )}
        </div>
      </div>
    </div>
  );
}
