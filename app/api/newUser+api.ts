import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('Saving user:', body);
        const user = await prisma.user.create({
            data: {
                name: body.name,
                email: body.email,
                picture: body.picture ?? '',
            },
            select: {
                id: true,
                name: true,
                email: true,
                picture: true
            }
        });
        return Response.json(user);
    } catch (error) { 
        console.error('Error saving user:', error);
        return Response.json({ error: error }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}