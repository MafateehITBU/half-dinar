import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectRedis } from './config/redis.js';
import { prisma } from './config/database.js';
import { searchService } from './application/services/search.service.js';

async function main() {
  await connectRedis();
  await prisma.$connect();
  await searchService.init();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Abu Al-Nas API running on ${env.API_URL} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
