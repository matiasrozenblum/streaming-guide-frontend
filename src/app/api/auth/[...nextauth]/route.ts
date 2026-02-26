import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignJWT, importPKCS8 } from 'jose';

const generateAppleClientSecret = async () => {
    if (!process.env.APPLE_PRIVATE_KEY) return '';
    try {
        const teamId = (process.env.APPLE_TEAM_ID || '').trim();
        const clientId = (process.env.APPLE_ID || '').trim();
        const keyId = (process.env.APPLE_KEY_ID || '').trim();

        const envKey = process.env.APPLE_PRIVATE_KEY || '';
        let privateKey = envKey.replace(/\\n/g, '\n');
        const matches = privateKey.match(/-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/);
        let base64 = matches ? matches[1] : privateKey;
        base64 = base64.replace(/\s+/g, '');
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
    const options = { ...authOptions };

    if (options.providers) {
        options.providers = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            options.providers.map(async (provider: any) => {
                if (provider.id === 'apple') {
                    return {
                        ...provider,
                        options: {
                            ...provider.options,
                            clientSecret: await generateAppleClientSecret()
                        },
                    };
                }
                return provider;
            })
        );
    }

    return NextAuth(options)(req, ctx);
};

export { handler as GET, handler as POST };