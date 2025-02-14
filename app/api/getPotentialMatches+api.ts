import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();
        console.log('Fetching matches for userId:', userId);

        // Get current user's preferences and info
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                gender: true,
                interests: true,
                likedUserIds: true,
                rejectedUserIds: true
            }
        });

        if (!currentUser) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // Modified gender filter logic with mutual interest matching
        let genderFilter: string[] = [];
        let interestsFilter: string[] = [];

        if (currentUser.interests === 'women') {
            genderFilter = ['female'];
            interestsFilter = ['men', 'both'];
        } else if (currentUser.interests === 'men') {
            genderFilter = ['male'];
            interestsFilter = ['women', 'both'];
        } else if (currentUser.interests === 'both') {
            genderFilter = ['male', 'female'];
            interestsFilter = ['men', 'women', 'both'];
        }

        console.log('Filtering criteria:', {
            myGender: currentUser.gender,
            myInterests: currentUser.interests,
            targetGenders: genderFilter,
            targetMustBeInterestedIn: interestsFilter
        });

        // Get potential matches with mutual interest filtering
        const potentialMatches = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: userId } },
                    { gender: { in: genderFilter } },
                    { interests: { in: interestsFilter } }, // They must be interested in people of my gender
                    { mainPicture: { not: null } },
                    { bio: { not: null } },
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
