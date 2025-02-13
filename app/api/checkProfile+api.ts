import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { userId } = await request.json();
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                bio: true,
                interests: true,
                mainPicture: true,
            }
        });

        const isComplete = !!(user?.bio && user?.interests && user?.mainPicture);

        return Response.json({ isComplete });
    } catch (error) {
        console.error('Error checking profile:', error);
        return Response.json({ error: 'Profile check failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
