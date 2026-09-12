import { NestFactory } from '@nestjs/core';
import { SeedModule } from './schemas/seed/seed.module.js';
import { SeedService } from './schemas/seed/seed.service.js';

async function bootstrap() {
  const app =
    await NestFactory.createApplicationContext(
      SeedModule,
    );

  try {
    const seedService =
      app.get(SeedService);

    await seedService.run();

    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);

    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

await bootstrap();