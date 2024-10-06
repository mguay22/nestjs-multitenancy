import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConfigService } from '@nestjs/config';
import { TenancyService } from '../tenancy/tenancy.service';
import { execSync } from 'child_process';
import { Schema, schema } from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private defaultPool: Pool;
  private readonly logger = new Logger(DatabaseService.name);
  private readonly tenantConnections: Map<
    string,
    { pool: Pool; database: NodePgDatabase<Schema> }
  > = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly tenancyService: TenancyService,
  ) {}

  async onModuleInit() {
    this.createDefaultPool();
    await this.createTenantConnections();
  }

  async onModuleDestroy() {
    await this.defaultPool.end();
    for (const connection of this.tenantConnections.values()) {
      await connection.pool.end();
    }
  }

  getDatabase() {
    return this.tenantConnections.get(
      this.tenancyService.getTenantContext().tenantId,
    ).database;
  }

  private async createDefaultPool() {
    this.defaultPool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  private async createTenantConnections() {
    for (const [tenantId, connectionString] of Object.entries(
      this.tenancyService.getTenants(),
    )) {
      await this.createTenantConnection(tenantId, connectionString);
      this.runMigrations(tenantId, connectionString);
    }
  }

  private async createTenantConnection(
    tenantId: string,
    connectionString: string,
  ) {
    await this.createDatabaseIfNotExists(tenantId);
    const pool = new Pool({ connectionString });
    const database = drizzle(pool, { schema });
    this.tenantConnections.set(tenantId, { pool, database });
  }

  private async createDatabaseIfNotExists(tenantId: string) {
    const result = await this.defaultPool.query(`
        SELECT 1
        FROM pg_database
        WHERE datname = '${tenantId}'    
    `);

    if (result.rowCount === 0) {
      await this.defaultPool.query(`CREATE DATABASE ${tenantId}`);
    }
  }

  private runMigrations(tenantId: string, connectionString: string) {
    const databaseUrl = this.configService.getOrThrow('DATABASE_URL');
    process.env.DATABASE_URL = connectionString;
    const output = execSync('drizzle-kit migrate --config drizzle.config.ts', {
      encoding: 'utf-8',
    });
    this.logger.log(`Migrations ran for tenant ${tenantId}: ${output}`);
    process.env.DATABASE_URL = databaseUrl;
  }
}
