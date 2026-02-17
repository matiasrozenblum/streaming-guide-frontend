import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://streaming-guide-backend-production.up.railway.app';

    try {
        const res = await fetch(`${backendUrl}/api/streamers/${id}/unsubscribe`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.accessToken}`,
            },
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData.message || 'Failed to unsubscribe' },
                { status: res.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error proxying unsubscribe request:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
