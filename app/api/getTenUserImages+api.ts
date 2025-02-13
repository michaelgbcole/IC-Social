import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        // Simply get first 10 users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                mainPicture: true,
                bio: true,
                age: true
            },
            take: 10,
            where: {
                mainPicture: {
                    not: null
                }
            }
        });

        return Response.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return Response.json({ error: error }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
