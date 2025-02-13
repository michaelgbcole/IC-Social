import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId, targetUserId, liked } = await request.json();

        if (liked) {
            // Get current user's liked list first
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { likedUserIds: true }
            });

            // Create new array with the new like
            const updatedLikedIds = [...(user?.likedUserIds || []), targetUserId];

            // Update current user's liked list
            const currentUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    likedUserIds: updatedLikedIds
                },
                select: {
                    likedUserIds: true
                }
            });

            // Check if target user has also liked current user
            const targetUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: {
                    likedUserIds: true
                }
            });

            const isMatch = targetUser?.likedUserIds.includes(userId) || false;
            
            console.log('Updated likes:', {
                userId,
                likedIds: currentUser.likedUserIds,
                isMatch
            });

            return Response.json({ isMatch });
        }

        return Response.json({ isMatch: false });
    } catch (error) {
        console.error('Error handling swipe:', error);
        return Response.json({ error: 'Failed to handle swipe' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
