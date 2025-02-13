import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { senderId, receiverId, content } = await request.json();
        
        const message = await prisma.message.create({
            data: {
                content,
                senderId,
                receiverId
            },
            select: {
                id: true,
                content: true,
                senderId: true,
                receiverId: true,
                createdAt: true
            }
        });

        console.log('Message created:', message); // Debug log
        return Response.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        return Response.json({ error: 'Failed to send message' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}