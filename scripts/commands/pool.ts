import { Command } from 'commander';
import { db } from '@/lib/db';
import chalk from 'chalk';
import Table from 'cli-table3';

export function poolCommands(program: Command) {
  const pool = program.command('pool')
    .description('Lending pool management');

  // List pools
  pool
    .command('list')
    .description('List all lending pools')
    .option('-c, --chain <chain>', 'Filter by chain')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🏊 Lending Pools\n'));

        const pools = db.pools.list(options.chain);

        if (pools.length === 0) {
          console.log(chalk.yellow('No pools found.\n'));
          return;
        }

        const table = new Table({
          head: [chalk.bold('ID'), chalk.bold('Name'), chalk.bold('Chain'), chalk.bold('Borrow APR'), chalk.bold('Status')],
          colWidths: [20, 15, 10, 12, 10],
        });

        pools.forEach(p => {
          table.push([
            p.id,
            p.name,
            p.chain,
            `${(p.borrowAPR * 100).toFixed(2)}%`,
            p.isActive ? chalk.green('Active') : chalk.red('Inactive'),
          ]);
        });

        console.log(table.toString());
        console.log();
      } catch (error) {
        console.error(chalk.red('❌ Failed to list pools:'), error);
        process.exit(1);
      }
    });

  // Show pool details
  pool
    .command('show')
    .description('Show pool details')
    .requiredOption('-i, --id <id>', 'Pool ID')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🔍 Pool Details\n'));

        const pool = db.pools.findById(options.id);

        if (!pool) {
          console.log(chalk.red(`❌ Pool not found: ${options.id}\n`));
          process.exit(1);
        }

        console.log(chalk.cyan('General:'));
        console.log(`  ID:                   ${pool.id}`);
        console.log(`  Name:                 ${pool.name}`);
        console.log(`  Protocol:             ${pool.protocol}`);
        console.log(`  Chain:                ${pool.chain}`);
        console.log(`  Contract:             ${pool.contractAddress}`);
        console.log();
        console.log(chalk.cyan('Rates:'));
        console.log(`  Borrow APR:           ${(pool.borrowAPR * 100).toFixed(2)}%`);
        console.log(`  Min Collateral:       ${(pool.minCollateralRatio * 100).toFixed(0)}%`);
        console.log(`  Liquidation Threshold: ${(pool.liquidationThreshold * 100).toFixed(0)}%`);
        console.log();
        console.log(chalk.cyan('Supported Assets:'));
        console.log(`  Collateral:           ${pool.supportedCollateral.join(', ')}`);
        console.log(`  Borrow:               ${pool.supportedBorrow.join(', ')}`);
        console.log();
      } catch (error) {
        console.error(chalk.red('❌ Failed to fetch pool:'), error);
        process.exit(1);
      }
    });
}
