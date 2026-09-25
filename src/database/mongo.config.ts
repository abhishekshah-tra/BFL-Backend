// import { ConfigService } from '@nestjs/config';
// import { MongooseModuleOptions } from '@nestjs/mongoose';

// export const mongoConfig = (
//     configService: ConfigService,
// ): MongooseModuleOptions => {
//     const host = configService.get<string>('MONGO_HOST');
//     const port = configService.get<string>('MONGO_PORT', '27017');
//     const username = configService.get<string>('MONGO_USERNAME');
//     const password = configService.get<string>('MONGO_PASSWORD');
//     const database = configService.get<string>('MONGO_DATABASE');

//     const autoIndex =
//         configService.get<string>('MONGO_AUTO_INDEX', 'true') === 'true';

//     if (!host) {
//         throw new Error('MONGO_HOST is not configured');
//     }

//     if (!username) {
//         throw new Error('MONGO_USERNAME is not configured');
//     }

//     if (!password) {
//         throw new Error('MONGO_PASSWORD is not configured');
//     }

//     if (!database) {
//         throw new Error('MONGO_DATABASE is not configured');
//     }

//     const uri =
//         `mongodb://${encodeURIComponent(username)}` +
//         `:${encodeURIComponent(password)}` +
//         `@${host}:${port}/${database}` +
//         `?authSource=admin`;

//    return {
//   uri,
//   autoIndex: true,
//   retryAttempts: 5,
//   retryDelay: 3000,

//   connectionFactory: (connection) => {
//     connection.on('connected', () => {
//       console.log('✅ MongoDB connected successfully');
//     });

//     connection.on('error', (error:any) => {
//       console.error('❌ MongoDB error:', error.message);
//     });

//     connection.on('disconnected', () => {
//       console.warn('⚠️ MongoDB disconnected');
//     });

//     connection.on('reconnected', () => {
//       console.log('🔄 MongoDB reconnected');
//     });

//     return connection;
//   },
// };
// };


import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';

export const mongoConfig = (
  configService: ConfigService,
): MongooseModuleOptions => {
  // ============================================================
  // MongoDB Environment Variables
  // ============================================================

  const host = configService.get<string>('MONGODB_HOST');
  const port = configService.get<string>('MONGODB_PORT', '27017');

  const username = configService.get<string>('MONGODB_USER');
  const password = configService.get<string>('MONGODB_PASS');

  const database = configService.get<string>('MONGO_DATABASE');

  const autoIndex =
    configService.get<string>('MONGO_AUTO_INDEX', 'true') === 'true';

  // TLS enabled/disabled
  const tlsEnabled =
    configService.get<string>('MONGO_TLS', 'false') === 'true';

  // ============================================================
  // Required Configuration Validation
  // ============================================================

  if (!host) {
    throw new Error('MONGODB_HOST is not configured');
  }

  if (!username) {
    throw new Error('MONGODB_USER is not configured');
  }

  if (!password) {
    throw new Error('MONGODB_PASS is not configured');
  }

  if (!database) {
    throw new Error('MONGO_DATABASE is not configured');
  }

  // ============================================================
  // MongoDB URI
  // ============================================================

  const uri =
    `mongodb://${encodeURIComponent(username)}` +
    `:${encodeURIComponent(password)}` +
    `@${host}:${port}/${database}` +
    `?authSource=admin`;

  // ============================================================
  // Base Mongoose Configuration
  // ============================================================

  const options: MongooseModuleOptions = {
    uri,

    autoIndex,

    retryAttempts: 5,
    retryDelay: 3000,

    connectionFactory: (connection) => {
      connection.on('connected', () => {
        console.log(
          `✅ MongoDB connected successfully ${
            tlsEnabled ? '(TLS)' : '(Local)'
          }`,
        );
      });

      connection.on('error', (error: Error) => {
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

  if (tlsEnabled) {
    const caFile = path.resolve(
      process.cwd(),
      'certs',
      'client.crt',
    );

    const clientCertFile = path.resolve(
      process.cwd(),
      'certs',
      'client.pem',
    );

    // Validate certificate files
    if (!fs.existsSync(caFile)) {
      throw new Error(`MongoDB CA file missing at: ${caFile}`);
    }

    if (!fs.existsSync(clientCertFile)) {
      throw new Error(
        `MongoDB client certificate missing at: ${clientCertFile}`,
      );
    }

    console.log('🔐 MongoDB TLS enabled');
    console.log(`📜 CA file: ${caFile}`);
    console.log(`🔑 Client certificate: ${clientCertFile}`);

    Object.assign(options, {
      tls: true,

      tlsCAFile: caFile,

      tlsCertificateKeyFile: clientCertFile,

      tlsAllowInvalidCertificates: false,

      tlsAllowInvalidHostnames: false,
    });
  }

  return options;
};