import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule, InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { User, UserSchema } from './user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class SchemasModule implements OnModuleInit {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    try {
      await this.connection.model(User.name).createCollection();

      console.log('✅ users collection created/verified');
    } catch (error:any) {
      console.error(
        '❌ Failed to create users collection:',
        error.message,
      );
    }
  }
}