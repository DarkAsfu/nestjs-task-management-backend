import 'dotenv/config';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import { Role } from './common/enums/role.enum';
import { TaskStatus } from './common/enums/task-status.enum';
import { AuditLog } from './audit-logs/entities/audit-log.entity';
import { Task } from './tasks/entities/task.entity';
import { User } from './users/entities/user.entity';

const appDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Task, AuditLog],
  synchronize: false,
});

async function seedData() {
  await appDataSource.initialize();

  const userRepository = appDataSource.getRepository(User);
  const taskRepository = appDataSource.getRepository(Task);

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

  const normalUser = await userRepository.findOne({
    where: { email: 'user@test.com' },
  });

  if (!normalUser) {
    console.log('Normal user not found. Task seeding skipped.');
    await appDataSource.destroy();
    return;
  }

  const tasksToSeed = [
    {
      title: 'Check dashboard data',
      description: 'Review today task dashboard numbers.',
      status: TaskStatus.PENDING,
    },
    {
      title: 'Update weekly report',
      description: 'Prepare and update this week report.',
      status: TaskStatus.PROCESSING,
    },
    {
      title: 'Clean old task notes',
      description: 'Remove outdated notes from task records.',
      status: TaskStatus.PENDING,
    },
  ];

  for (const seedTask of tasksToSeed) {
    const existingTask = await taskRepository.findOne({
      where: { title: seedTask.title },
    });

    if (existingTask) {
      console.log(`Task already exists: ${seedTask.title}`);
      continue;
    }

    const newTask = taskRepository.create({
      title: seedTask.title,
      description: seedTask.description,
      status: seedTask.status,
      assignedUser: normalUser,
    });

    await taskRepository.save(newTask);
    console.log(`Task created: ${seedTask.title}`);
  }

  await appDataSource.destroy();
  console.log('Seeding complete.');
}

seedData().catch(async (error) => {
  console.error('Seeding failed:', error);
  if (appDataSource.isInitialized) {
    await appDataSource.destroy();
  }
  process.exit(1);
});
