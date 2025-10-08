import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  console.log(`[Frontend Revalidate] ===== REVALIDATION REQUEST RECEIVED =====`);
  console.log(`[Frontend Revalidate] Request URL: ${req.url}`);
  console.log(`[Frontend Revalidate] Request headers:`, Object.fromEntries(req.headers.entries()));
  
  const { path, secret } = await req.json();
  
  console.log(`[Frontend Revalidate] Received revalidation request for path: ${path}`);
  console.log(`[Frontend Revalidate] Secret provided: ${secret ? secret.substring(0, 8) + '...' : 'none'}`);
  console.log(`[Frontend Revalidate] Expected secret: ${process.env.REVALIDATE_SECRET ? process.env.REVALIDATE_SECRET.substring(0, 8) + '...' : 'none'}`);

  // Protect with a secret token
  if (secret !== process.env.REVALIDATE_SECRET) {
    console.log(`[Frontend Revalidate] ❌ Invalid secret provided`);
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    console.log(`[Frontend Revalidate] ✅ Valid secret, revalidating path: ${path}`);
    // Revalidate the given path
    await revalidatePath(path);
    console.log(`[Frontend Revalidate] ✅ Successfully revalidated path: ${path}`);
    return NextResponse.json({ revalidated: true, now: Date.now(), path });
  } catch (err) {
    console.log(`[Frontend Revalidate] ❌ Error revalidating path ${path}:`, err);
    return NextResponse.json({ message: 'Error revalidating', error: err }, { status: 500 });
  }
} 