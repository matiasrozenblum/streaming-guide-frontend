import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignJWT, importPKCS8 } from 'jose';

const generateAppleClientSecret = async () => {
    if (!process.env.APPLE_PRIVATE_KEY) return '';
    try {
        const teamId = process.env.APPLE_TEAM_ID!;
        const clientId = process.env.APPLE_ID!;
        const keyId = process.env.APPLE_KEY_ID!;
        let privateKey = process.env.APPLE_PRIVATE_KEY;
        // Try to extract just the base64 content
        const matches = privateKey.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
        let base64 = matches ? matches[1] : privateKey;
        // Remove all whitespace (including newlines, tabs, and spaces)
        base64 = base64.replace(/\s+/g, '');
        // Reconstruct the proper PEM (64 chars per line)
        const formattedBase64 = base64.match(/.{1,64}/g)?.join('\n') || '';
        privateKey = `-----BEGIN PRIVATE KEY-----\n${formattedBase64}\n-----END PRIVATE KEY-----`;

        const secretKey = await importPKCS8(privateKey, 'ES256');

        return await new SignJWT({})
            .setProtectedHeader({ alg: 'ES256', kid: keyId })
            .setIssuedAt()
            .setIssuer(teamId)
            .setAudience('https://appleid.apple.com')
            .setSubject(clientId)
            .setExpirationTime(Math.round(Date.now() / 1000) + 86400 * 30) // 30 days
            .sign(secretKey);
    } catch (error) {
        console.error('Failed to generate Apple client secret:', error);
        return '';
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = async (req: Request, ctx: any) => {
    // Dynamically inject the Apple clientSecret JWT at request time
    const options = { ...authOptions };

    if (options.providers) {
        options.providers = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options.providers.map(async (provider: any) => {
                if (provider.id === 'apple') {
                    return {
                        ...provider,
                        clientSecret: await generateAppleClientSecret(),
                    };
                }
                return provider;
            })
        );
    }

    return NextAuth(options)(req, ctx);
};

export { handler as GET, handler as POST };