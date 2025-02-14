import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();
        console.log('Fetching matches for userId:', userId);

        // Get current user's preferences and acted-upon users
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                gender: true,
                interests: true,
                likedUserIds: true,
                rejectedUserIds: true
            }
        });

        console.log('Current user data:', currentUser);

        if (!currentUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Get all users for debugging
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                gender: true,
                interests: true
            }
        });
        console.log('All users in system:', allUsers);

        // Modified gender filter logic
        let genderFilter: string[] = [];
        if (currentUser.interests === 'women') {
            genderFilter = ['female'];
        } else if (currentUser.interests === 'men') {
            genderFilter = ['male'];
        } else if (currentUser.interests === 'both') {
            genderFilter = ['male', 'female'];
        }
        
        console.log('Gender filter:', genderFilter);
        console.log('Previously liked users:', currentUser.likedUserIds);
        console.log('Previously rejected users:', currentUser.rejectedUserIds);

        // Get potential matches with more detailed logging
        const potentialMatches = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } }, // Not the current user
                    { gender: { in: genderFilter } }, // Matches gender preference
                    { mainPicture: { not: null } }, // Has a profile picture
                    { bio: { not: null } }, // Has a bio
                    {
                        id: {
                            notIn: [
                                ...(currentUser.likedUserIds || []),
                                ...(currentUser.rejectedUserIds || [])
                            ]
                        }
                    }
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
        });

        console.log('Found potential matches:', potentialMatches);

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
        console.log('Users who liked me:', userIdsWhoLikedMe);

        const matchesWithLikeInfo = potentialMatches.map(match => ({
            ...match,
            hasLikedMe: userIdsWhoLikedMe.includes(match.id),
            mutualLike: userIdsWhoLikedMe.includes(match.id) && 
                        (currentUser.likedUserIds || []).includes(match.id)
        }));

        console.log('Final matches with like info:', matchesWithLikeInfo);
        return Response.json(matchesWithLikeInfo);

    } catch (error) {
        console.error('Error in getPotentialMatches:', error);
        return Response.json({ 
            error: 'Failed to fetch matches',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
