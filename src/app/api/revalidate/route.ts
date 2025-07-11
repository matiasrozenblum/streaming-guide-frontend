import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const { path, secret } = await req.json();

  console.log('[Revalidate API] Received request for path:', path);

  // Protect with a secret token
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    // Revalidate the given path
    await revalidatePath(path);
    console.log('[Revalidate API] Successfully revalidated path:', path);
    return NextResponse.json({ revalidated: true, now: Date.now(), path });
  } catch (err) {
    console.error('[Revalidate API] Error revalidating path:', path, err);
    return NextResponse.json({ message: 'Error revalidating', error: err }, { status: 500 });
  }
} 