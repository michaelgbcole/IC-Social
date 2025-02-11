import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get('/api/getUserIds', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true }
    });
    const userIds = users.map(user => user.id); // Transform to array of strings
    res.json(userIds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user IDs' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
