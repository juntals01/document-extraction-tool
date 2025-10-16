import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        // Prefer DATABASE_URL if provided; else fall back to discrete vars
        url: process.env.DATABASE_URL || undefined,
        host: process.env.DATABASE_URL
          ? undefined
          : process.env.POSTGRES_HOST || 'localhost',
        port: process.env.DATABASE_URL
          ? undefined
          : Number(process.env.POSTGRES_PORT || 5433),
        username: process.env.DATABASE_URL
          ? undefined
          : process.env.POSTGRES_USER || 'docxt',
        password: process.env.DATABASE_URL
          ? undefined
          : process.env.POSTGRES_PASSWORD || 'docxt',
        database: process.env.DATABASE_URL
          ? undefined
          : process.env.POSTGRES_DB || 'docxt',

        // Entity discovery
        autoLoadEntities: true, // picks up all @Entity() classes from imported forFeature modules
        synchronize: true, // dev only; set false and use migrations in prod
        logging: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DbModule {}
