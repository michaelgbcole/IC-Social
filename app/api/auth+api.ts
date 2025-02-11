import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email: body.email },
            select: {
                id: true,
                name: true,
                email: true,
                picture: true
            }
        });

        // If user doesn't exist, create new user
        if (!user) {
            user = await prisma.user.create({
                data: {
                    name: body.name,
                    email: body.email,
                    picture: body.picture ?? '',
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    picture: true
                }
            });
        }

        return Response.json(user);
    } catch (error) {
        console.error('Error in auth:', error);
        return Response.json({ error: 'Authentication failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
