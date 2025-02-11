import prisma from "@/lib/prisma";

export async function GET() {
    console.log('Getting user ids');
  const userIds = await prisma.user.findMany({
    select: {
      id: true,
    },
  });
  return Response.json(userIds[0].id);
}