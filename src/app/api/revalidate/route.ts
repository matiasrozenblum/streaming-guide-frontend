import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const { path, tag, secret } = await req.json();

  if (secret !== process.env.REVALIDATE_SECRET) {
    console.log(`[Revalidate] ❌ Invalid secret`);
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    if (tag) {
      revalidateTag(tag);
      console.log(`[Revalidate] ✅ Revalidated tag: ${tag}`);
      return NextResponse.json({ revalidated: true, now: Date.now(), tag });
    }
    if (path) {
      revalidatePath(path);
      console.log(`[Revalidate] ✅ Revalidated path: ${path}`);
      return NextResponse.json({ revalidated: true, now: Date.now(), path });
    }
    return NextResponse.json({ message: 'Either path or tag is required' }, { status: 400 });
  } catch (err) {
    console.log(`[Revalidate] ❌ Error:`, err);
    return NextResponse.json({ message: 'Error revalidating', error: err }, { status: 500 });
  }
}
