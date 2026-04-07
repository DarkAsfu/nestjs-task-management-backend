import 'dotenv/config';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import { Role } from './common/enums/role.enum';
import { AuditLog } from './audit-logs/entities/audit-log.entity';
import { Task } from './tasks/entities/task.entity';
import { User } from './users/entities/user.entity';

const appDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Task, AuditLog],
  synchronize: false,
});

async function seedUsers() {
  await appDataSource.initialize();

  const userRepository = appDataSource.getRepository(User);

  const usersToSeed = [
    {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: Role.ADMIN,
    },
    {
      name: 'Normal User',
      email: 'user@test.com',
      password: 'user123',
      role: Role.USER,
    },
  ];

  for (const seedUser of usersToSeed) {
    const existingUser = await userRepository.findOne({
      where: { email: seedUser.email },
    });

    if (existingUser) {
      console.log(`User already exists: ${seedUser.email}`);
      continue;
    }

    const hashedPassword = await hash(seedUser.password, 10);

    const newUser = userRepository.create({
      name: seedUser.name,
      email: seedUser.email,
      password: hashedPassword,
      role: seedUser.role,
    });

    await userRepository.save(newUser);
    console.log(`User created: ${seedUser.email}`);
  }

  await appDataSource.destroy();
  console.log('Seeding complete.');
}

seedUsers().catch(async (error) => {
  console.error('Seeding failed:', error);
  if (appDataSource.isInitialized) {
    await appDataSource.destroy();
  }
  process.exit(1);
});
