import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();

        // Get current user's preferences and liked users
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                gender: true,
                interests: true,
                likedUserIds: true
            }
        });

        if (!currentUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Build gender filter
        let genderFilter: string[] = [];
        if (currentUser.interests === 'men') {
            genderFilter = ['male'];
        } else if (currentUser.interests === 'women') {
            genderFilter = ['female'];
        } else if (currentUser.interests === 'both') {
            genderFilter = ['male', 'female'];
        }

        // Get users who have liked the current user
        const usersWhoLikedMe = await prisma.user.findMany({
            where: {
                likedUserIds: {
                    has: userId
                }
            },
            select: {
                id: true
            }
        });

        const userIdsWhoLikedMe = usersWhoLikedMe.map(user => user.id);

        // Get potential matches
        const potentialMatches = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } },
                    { gender: { in: genderFilter } },
                    { mainPicture: { not: null } },
                    { bio: { not: null } },
                ]
            },
            select: {
                id: true,
                name: true,
                mainPicture: true,
                bio: true,
                age: true,
                gender: true,
            },
            take: 10,
        });

        // Add mutual like information to each potential match
        const matchesWithLikeInfo = potentialMatches.map(match => ({
            ...match,
            hasLikedMe: userIdsWhoLikedMe.includes(match.id),
            mutualLike: userIdsWhoLikedMe.includes(match.id) && currentUser.likedUserIds.includes(match.id)
        }));

        return Response.json(matchesWithLikeInfo);
    } catch (error) {
        console.error('Error fetching potential matches:', error);
        return Response.json({ error: 'Failed to fetch matches' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
