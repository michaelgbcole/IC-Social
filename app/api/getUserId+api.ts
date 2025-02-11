import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
    const body = await request.json();
    console.log('Saving user:', body);
    const user = await prisma.user.findFirst({
        where: { email: body.email },
        select: {
            id: true,
        
        },

    })
    return Response.json(user);
} catch (error) { 
    console.error('Error getting userId:', error);
    return Response.json({ error: 'Error getting userId' }, { status: 500 });
} finally {
    await prisma.$disconnect
}
  }