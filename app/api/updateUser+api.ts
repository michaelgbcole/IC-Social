import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
    const body = await request.json();
    console.log('Saving user:', body);
    const user = await prisma.user.update({
        where: { id: body.id },
        data: {
            name: body.name,
            email: body.email,
            picture: body.picture ?? '',
            interests: body.interests,
            bio: body.bio,
            mainPicture: body.mainPicture,
            age: body.age,
            gender: body.gender
        },

    })
    return Response.json(user);
} catch (error) { 
    console.error('Error saving user:', error);
    return Response.json({ error: 'Error saving user' }, { status: 500 });
} finally {
    await prisma.$disconnect
}
  }