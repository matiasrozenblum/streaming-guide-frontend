import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params = url.searchParams.toString();
  const backendUrl = `${process.env.BACKEND_URL}/statistics/reports/users?${params}`;
  const res = await fetch(backendUrl, {
    headers: {
      // Add auth headers if needed
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
} 