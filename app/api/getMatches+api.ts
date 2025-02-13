import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { likedUserIds: true }
        });

        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        const matches = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { in: user.likedUserIds } },
                    { likedUserIds: { has: userId } }
                ]
            },
            select: {
                id: true,
                name: true,
                mainPicture: true,
                receivedMessages: {
                    where: { senderId: userId },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                sentMessages: {
                    where: { receiverId: userId },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        return Response.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }
}