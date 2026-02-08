import { Command } from 'commander';
import { execSync } from 'child_process';
import chalk from 'chalk';

export function dbCommands(program: Command) {
  const db = program.command('db')
    .description('Database management commands');

  // Seed database
  db
    .command('seed')
    .description('Seed database with initial data')
    .action(async () => {
      try {
        console.log(chalk.blue('\n🌱 Seeding database...\n'));
        
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
        
        console.log(chalk.green('\n✅ Database seeded successfully!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to seed database'));
        process.exit(1);
      }
    });

  // Reset database
  db
    .command('reset')
    .description('Reset database (⚠️ deletes all data)')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      if (!options.force) {
        console.log(chalk.red('\n⚠️  WARNING: This will DELETE ALL DATA!\n'));
        console.log(chalk.gray('Use --force to skip confirmation\n'));
        process.exit(1);
      }

      try {
        console.log(chalk.yellow('\n🗑️  Resetting database...\n'));
        
        execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
        
        console.log(chalk.green('\n✅ Database reset successfully!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to reset database'));
        process.exit(1);
      }
    });

  // Studio
  db
    .command('studio')
    .description('Open Prisma Studio (database GUI)')
    .action(async () => {
      try {
        console.log(chalk.blue('\n🎨 Opening Prisma Studio...\n'));
        console.log(chalk.gray('Visit: http://localhost:5555\n'));
        
        execSync('npx prisma studio', { stdio: 'inherit' });
      } catch (error) {
        console.error(chalk.red('❌ Failed to open studio'));
        process.exit(1);
      }
    });

  // Generate client
  db
    .command('generate')
    .description('Generate Prisma client')
    .action(async () => {
      try {
        console.log(chalk.blue('\n⚙️  Generating Prisma client...\n'));
        
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        console.log(chalk.green('\n✅ Prisma client generated!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to generate client'));
        process.exit(1);
      }
    });

  // Migrate
  db
    .command('migrate')
    .description('Run database migrations')
    .option('-n, --name <name>', 'Migration name')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🔄 Running migrations...\n'));
        
        const cmd = options.name 
          ? `npx prisma migrate dev --name ${options.name}`
          : 'npx prisma migrate dev';
        
        execSync(cmd, { stdio: 'inherit' });
        
        console.log(chalk.green('\n✅ Migrations complete!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Migration failed'));
        process.exit(1);
      }
    });
}
