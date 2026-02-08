import { Command } from 'commander';
import { db } from '@/lib/db';
import chalk from 'chalk';
import Table from 'cli-table3';

export function reportCommands(program: Command) {
  const report = program.command('report')
    .description('Generate reports');

  // Daily report
  report
    .command('daily')
    .description('Generate daily activity report')
    .option('-d, --date <date>', 'Date (YYYY-MM-DD)', new Date().toISOString().split('T')[0])
    .action(async (options) => {
      try {
        console.log(chalk.blue(`\n📅 Daily Report: ${options.date}\n`));

        const startOfDay = new Date(options.date);
        const endOfDay = new Date(options.date);
        endOfDay.setDate(endOfDay.getDate() + 1);

        // Sessions created
        const sessions = await db.prisma.widgetSession.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });

        // Loans created
        const loans = await db.prisma.loan.findMany({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        });

        // Revenue estimate (assuming 0.5% fee)
        const volume = loans.reduce((sum, l) => sum + l.principalAmount, 0);
        const revenue = volume * 0.005;

        console.log(chalk.cyan('Activity:'));
        console.log(`  Widget Sessions:     ${sessions}`);
        console.log(`  Loans Created:       ${loans.length}`);
        console.log(`  Volume:              $${volume.toLocaleString()}`);
        console.log(`  Est. Revenue (0.5%): $${revenue.toLocaleString()}`);
        console.log();

        if (loans.length > 0) {
          console.log(chalk.cyan('Loan Details:'));
          const table = new Table({
            head: [chalk.bold('ID'), chalk.bold('Merchant'), chalk.bold('Amount'), chalk.bold('Status')],
            colWidths: [20, 20, 15, 12],
          });

          loans.forEach(l => {
            table.push([
              l.id,
              l.merchantId.slice(0, 17),
              `$${l.principalAmount.toLocaleString()}`,
              l.status,
            ]);
          });

          console.log(table.toString());
          console.log();
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to generate report:'), error);
        process.exit(1);
      }
    });

  // Merchant report
  report
    .command('merchant')
    .description('Generate merchant performance report')
    .requiredOption('-i, --id <id>', 'Merchant ID')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🏪 Merchant Performance Report\n'));

        const merchant = await db.merchants.findById(options.id);
        if (!merchant) {
          console.log(chalk.red('❌ Merchant not found\n'));
          process.exit(1);
        }

        const loans = await db.loans.findByMerchant(options.id);

        console.log(chalk.cyan('Merchant:'));
        console.log(`  Name:     ${merchant.name}`);
        console.log(`  ID:       ${merchant.id}`);
        console.log(`  Wallet:   ${merchant.walletAddress}`);
        console.log();

        console.log(chalk.cyan('Performance:'));
        console.log(`  Total Loans:    ${loans.length}`);
        console.log(`  Total Volume:   $${loans.reduce((s, l) => s + l.principalAmount, 0).toLocaleString()}`);
        console.log(`  Active Loans:   ${loans.filter(l => l.status === 'active').length}`);
        console.log(`  Repaid Loans:   ${loans.filter(l => l.status === 'repaid').length}`);
        console.log();

        if (loans.length > 0) {
          const table = new Table({
            head: [chalk.bold('Date'), chalk.bold('Amount'), chalk.bold('Status'), chalk.bold('Health')],
            colWidths: [20, 15, 12, 10],
          });

          loans.slice(0, 10).forEach(l => {
            table.push([
              new Date(l.createdAt).toLocaleDateString(),
              `$${l.principalAmount.toLocaleString()}`,
              l.status,
              l.healthFactor?.toFixed(2) || '-',
            ]);
          });

          console.log(chalk.cyan('Recent Loans:'));
          console.log(table.toString());
          console.log();
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to generate report:'), error);
        process.exit(1);
      }
    });
}
