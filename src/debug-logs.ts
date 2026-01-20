
import { DataSource } from 'typeorm';
import { ActivityLogEntity } from './admin/activity-log.entity';
import { UserEntity } from './admin/user.entity';
import { TenantEntity } from './admin/tenant.entity';
import { config } from 'dotenv';
config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: 'root',
    database: 'Saas',
    entities: [ActivityLogEntity, UserEntity, TenantEntity],
    synchronize: false,
});

async function run() {
    await AppDataSource.initialize();
    const tenantId = '40057f0e-3247-41d9-8730-73d3667a142e';

    console.log(`Checking logs for tenant: ${tenantId}`);

    const repo = AppDataSource.getRepository(ActivityLogEntity);
    const logs = await repo.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 10
    });

    console.log(`Found ${logs.length} logs.`);
    console.log(JSON.stringify(logs, null, 2));

    await AppDataSource.destroy();
}

run().catch(console.error);
