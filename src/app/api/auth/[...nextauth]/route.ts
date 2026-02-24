import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignJWT, importPKCS8 } from 'jose';

const generateAppleClientSecret = async () => {
    if (!process.env.APPLE_PRIVATE_KEY) return '';
    try {
        const teamId = process.env.APPLE_TEAM_ID!;
        const clientId = process.env.APPLE_ID!;
        const keyId = process.env.APPLE_KEY_ID!;
        // Normalize escaped newlines from environment variables
        const privateKey = process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n');

        const secretKey = await importPKCS8(privateKey, 'ES256');

        return await new SignJWT({})
            .setProtectedHeader({ alg: 'ES256', kid: keyId })
            .setIssuedAt()
            .setIssuer(teamId)
            .setAudience('https://appleid.apple.com')
            .setSubject(clientId)
            .setExpirationTime('180d')
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