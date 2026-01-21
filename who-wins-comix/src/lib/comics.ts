"use client";

import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export type ComicVisibility = "private" | "friends" | "public";

export async function uploadComic(args: {
  uid: string;
  file: File;
  title: string;
  visibility: ComicVisibility;
}) {
  const ext = args.file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["cbz","cbr"].includes(ext)) throw new Error("Upload a .cbz or .cbr file.");
  if (args.file.size > 4096 * 1024 * 1024) throw new Error("File too large. Contact @admin.");

  const user = auth.currentUser;
  if (!user) throw new Error("Sign in first.");
  if (user.uid !== args.uid) throw new Error("Auth mismatch.");
  const idToken = await user.getIdToken();

  // 1) Get a presigned PUT URL from the server (Backblaze B2)
  const pres = await fetch("/api/b2/presign-upload", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${idToken}`,
    },
    body: JSON.stringify({ filename: args.file.name, contentType: "application/octet-stream" }),
  });
  const presJson = await pres.json();
  if (!pres.ok) throw new Error(presJson?.error ?? "Failed to get upload URL");

  // 2) Upload file directly to B2
  const put = await fetch(presJson.uploadUrl, {
    method: "PUT",
    headers: { "content-type": "application/octet-stream" },
    body: args.file,
  });
  if (!put.ok) throw new Error("Upload failed.");

  const objectKey = presJson.objectKey as string;

  const docRef = await addDoc(collection(db, "comics"), {
    ownerUid: args.uid,
    title: args.title,
    visibility: args.visibility,
    objectKey,
    filename: args.file.name,
    sizeBytes: args.file.size,
    createdAt: serverTimestamp(),
  });

  return { comicId: docRef.id, objectKey };
}
