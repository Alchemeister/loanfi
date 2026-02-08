import { Command } from 'commander';
import { db } from '@/lib/db';
import chalk from 'chalk';
import Table from 'cli-table3';

export function loanCommands(program: Command) {
  const loan = program.command('loan')
    .description('Loan management and analytics');

  // List loans
  loan
    .command('list')
    .description('List all loans')
    .option('-m, --merchant <id>', 'Filter by merchant ID')
    .option('-s, --status <status>', 'Filter by status (active, repaid, liquidated)')
    .option('-l, --limit <number>', 'Limit results', '50')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n📊 Fetching loans...\n'));

        let loans: any[] = [];

        if (options.merchant) {
          loans = await db.loans.findByMerchant(options.merchant);
        } else {
          // Get all loans (limited)
          const allLoans = await db.prisma.loan.findMany({
            take: parseInt(options.limit),
            orderBy: { createdAt: 'desc' },
            include: { merchant: true },
          });
          loans = allLoans;
        }

        if (options.status) {
          loans = loans.filter(l => l.status === options.status);
        }

        if (loans.length === 0) {
          console.log(chalk.yellow('No loans found.\n'));
          return;
        }

        const table = new Table({
          head: [chalk.bold('ID'), chalk.bold('Merchant'), chalk.bold('Amount'), chalk.bold('Status'), chalk.bold('Created')],
          colWidths: [20, 20, 15, 12, 20],
        });

        loans.forEach(l => {
          const statusColor = {
            active: chalk.green,
            repaid: chalk.blue,
            liquidated: chalk.red,
            defaulted: chalk.red,
          }[l.status] || chalk.gray;

          table.push([
            l.id,
            l.merchant?.name?.slice(0, 17) || 'Unknown',
            `$${l.principalAmount.toLocaleString()}`,
            statusColor(l.status),
            new Date(l.createdAt).toLocaleDateString(),
          ]);
        });

        console.log(table.toString());
        console.log(chalk.gray(`\nShowing ${loans.length} loan(s)\n`));
      } catch (error) {
        console.error(chalk.red('❌ Failed to list loans:'), error);
        process.exit(1);
      }
    });

  // Show loan details
  loan
    .command('show')
    .description('Show loan details')
    .requiredOption('-i, --id <id>', 'Loan ID')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🔍 Fetching loan details...\n'));

        const loan = await db.loans.findById(options.id);

        if (!loan) {
          console.log(chalk.red(`❌ Loan not found: ${options.id}\n`));
          process.exit(1);
        }

        console.log(chalk.cyan('Loan Details:'));
        console.log(`  ID:                ${loan.id}`);
        console.log(`  Status:            ${loan.status.toUpperCase()}`);
        console.log(`  Borrower:          ${loan.borrowerAddress}`);
        console.log();
        console.log(chalk.cyan('Loan Terms:'));
        console.log(`  Principal:         $${loan.principalAmount.toLocaleString()} ${loan.principalToken}`);
        console.log(`  Term:              ${loan.termMonths} months`);
        console.log(`  APR:               ${(loan.apr * 100).toFixed(2)}%`);
        console.log(`  Monthly Payment:   $${loan.monthlyPayment.toLocaleString()}`);
        console.log(`  Total Repayment:   $${loan.totalRepayment.toLocaleString()}`);
        console.log();
        console.log(chalk.cyan('Collateral:'));
        console.log(`  Token:             ${loan.collateralToken}`);
        console.log(`  Amount:            ${loan.collateralAmount}`);
        console.log(`  Value at Loan:     $${loan.collateralValueUSD.toLocaleString()}`);
        console.log(`  Health Factor:     ${loan.healthFactor.toFixed(2)}`);
        console.log();
        console.log(chalk.cyan('Transactions:'));
        console.log(`  Borrow Tx:         ${loan.borrowTxHash}`);
        console.log(`  Payment Tx:        ${loan.paymentTxHash}`);
        console.log(`  Created:           ${new Date(loan.createdAt).toLocaleString()}`);
        console.log();
      } catch (error) {
        console.error(chalk.red('❌ Failed to fetch loan:'), error);
        process.exit(1);
      }
    });

  // Loan statistics
  loan
    .command('stats')
    .description('Show loan statistics')
    .option('-m, --merchant <id>', 'Filter by merchant')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n📈 Loan Statistics\n'));

        const where = options.merchant ? { merchantId: options.merchant } : {};

        const stats = await db.prisma.loan.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
          _sum: { principalAmount: true },
        });

        const totalStats = await db.prisma.loan.aggregate({
          where,
          _count: { id: true },
          _sum: { 
            principalAmount: true,
            totalRepayment: true,
          },
        });

        console.log(chalk.cyan('Overview:'));
        console.log(`  Total Loans:       ${totalStats._count.id}`);
        console.log(`  Total Volume:      $${(totalStats._sum.principalAmount || 0).toLocaleString()}`);
        console.log(`  Total Repayments:  $${(totalStats._sum.totalRepayment || 0).toLocaleString()}`);
        console.log();

        if (stats.length > 0) {
          console.log(chalk.cyan('By Status:'));
          const table = new Table({
            head: [chalk.bold('Status'), chalk.bold('Count'), chalk.bold('Volume')],
            colWidths: [15, 10, 20],
          });

          stats.forEach(s => {
            const color = {
              active: chalk.green,
              repaid: chalk.blue,
              liquidated: chalk.red,
            }[s.status] || chalk.gray;

            table.push([
              color(s.status),
              s._count.id.toString(),
              `$${(s._sum.principalAmount || 0).toLocaleString()}`,
            ]);
          });

          console.log(table.toString());
        }
        console.log();
      } catch (error) {
        console.error(chalk.red('❌ Failed to fetch stats:'), error);
        process.exit(1);
      }
    });
}
