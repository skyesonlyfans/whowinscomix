import { NextResponse } from "next/server";
import { presignDownload } from "@/lib/b2Server";
import { requireUserUidFromAuthHeader } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    // We verify the user is signed in; access control beyond that is handled in Firestore (owner/friends/public).
    await requireUserUidFromAuthHeader(req);
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("objectKey") || "";
    if (!key) throw new Error("Missing objectKey");
    const { url } = await presignDownload({ objectKey: key });
    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to presign download" }, { status: 400 });
  }
}
