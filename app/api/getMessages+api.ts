import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId, matchId } = await request.json();
        
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { AND: [{ senderId: userId }, { receiverId: matchId }] },
                    { AND: [{ senderId: matchId }, { receiverId: userId }] }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return Response.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}