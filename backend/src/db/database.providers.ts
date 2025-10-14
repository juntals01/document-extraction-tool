import { DataSource } from 'typeorm';

export const dbProvider = {
  provide: 'DATA_SOURCE',
  useFactory: async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5433,
      username: process.env.POSTGRES_USER || 'docxt',
      password: process.env.POSTGRES_PASSWORD || 'docxt',
      database: process.env.POSTGRES_DB || 'docxt',
      entities: [__dirname + '/../**/*.entity.{ts,js}'],
      synchronize: true,
    });

    return dataSource.initialize();
  },
};
