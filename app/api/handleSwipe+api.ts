import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId, targetUserId, liked } = await request.json();

        if (liked) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    likedUserIds: {
                        push: targetUserId
                    }
                }
            });
        } else {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    rejectedUserIds: {
                        push: targetUserId
                    }
                }
            });
        }

        // Check for match
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { likedUserIds: true }
        });

        const isMatch = liked && targetUser?.likedUserIds.includes(userId);

        return Response.json({ isMatch });
    } catch (error) {
        console.error('Error handling swipe:', error);
        return Response.json({ error: 'Failed to handle swipe' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
