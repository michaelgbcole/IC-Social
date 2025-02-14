import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Auth request body:', body); // Debug log

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: body.email }
        });

        // If user doesn't exist, create new user
        if (!user) {
            console.log('Creating new user:', body); // Debug log
            user = await prisma.user.create({
                data: {
                    name: body.name,
                    email: body.email,
                    picture: body.picture,
                    likedUserIds: [],
                    rejectedUserIds: [],
                }
            });
            console.log('New user created:', user); // Debug log
        }

        if (!user) {
            throw new Error('Failed to create or find user');
        }

        return Response.json(user);
    } catch (error) {
        console.error('Error in auth:', error);
        return Response.json({ 
            error: 'Authentication failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
