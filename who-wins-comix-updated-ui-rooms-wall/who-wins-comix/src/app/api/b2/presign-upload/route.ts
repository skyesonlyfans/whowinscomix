import { NextResponse } from "next/server";
import { presignComicUpload } from "@/lib/b2Server";
import { requireUserUidFromAuthHeader } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const uid = await requireUserUidFromAuthHeader(req);
    const body = await req.json();
    const filename = String(body.filename ?? "");
    const contentType = String(body.contentType ?? "application/octet-stream");
    if (!filename) throw new Error("Missing filename");
    const { objectKey, uploadUrl } = await presignComicUpload({ uid, filename, contentType });
    return NextResponse.json({ objectKey, uploadUrl });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to presign upload" },
      { status: 400 }
    );
  }
}
