import { NextRequest, NextResponse } from 'next/server';
import { requireAccessToken } from '@/utils/auth-server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = await requireAccessToken(request);
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/streamers/${id}/sync-live-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to sync live status');
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error syncing live status:', error);
        return NextResponse.json(
            {
                error: 'Failed to sync live status',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
