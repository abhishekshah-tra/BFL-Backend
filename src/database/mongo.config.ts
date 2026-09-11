import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const mongoConfig = (
    configService: ConfigService,
): MongooseModuleOptions => {
    const host = configService.get<string>('MONGO_HOST');
    const port = configService.get<string>('MONGO_PORT', '27017');
    const username = configService.get<string>('MONGO_USERNAME');
    const password = configService.get<string>('MONGO_PASSWORD');
    const database = configService.get<string>('MONGO_DATABASE');

    const autoIndex =
        configService.get<string>('MONGO_AUTO_INDEX', 'true') === 'true';

    if (!host) {
        throw new Error('MONGO_HOST is not configured');
    }

    if (!username) {
        throw new Error('MONGO_USERNAME is not configured');
    }

    if (!password) {
        throw new Error('MONGO_PASSWORD is not configured');
    }

    if (!database) {
        throw new Error('MONGO_DATABASE is not configured');
    }

    const uri =
        `mongodb://${encodeURIComponent(username)}` +
        `:${encodeURIComponent(password)}` +
        `@${host}:${port}/${database}` +
        `?authSource=admin`;

   return {
  uri,
  autoIndex: true,
  retryAttempts: 5,
  retryDelay: 3000,

  connectionFactory: (connection) => {
    connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    connection.on('error', (error:any) => {
      console.error('❌ MongoDB error:', error.message);
    });

    connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return connection;
  },
};
};