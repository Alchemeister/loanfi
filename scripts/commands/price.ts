import { Command } from 'commander';
import { db } from '@/lib/db';
import { refreshAllPrices, getTokenPrice } from '@/lib/blockchain/prices';
import chalk from 'chalk';
import Table from 'cli-table3';

export function priceCommands(program: Command) {
  const price = program.command('price')
    .description('Price feed management');

  // Update all prices
  price
    .command('update')
    .description('Refresh all token prices from sources')
    .option('-c, --chain <chain>', 'Chain to update (default: base)', 'base')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n💰 Updating token prices...\n'));
        
        await refreshAllPrices(options.chain);
        
        console.log(chalk.green('\n✅ Prices updated successfully!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to update prices:'), error);
        process.exit(1);
      }
    });

  // Show current prices
  price
    .command('show')
    .description('Show current token prices')
    .option('-t, --token <token>', 'Show specific token')
    .option('-c, --chain <chain>', 'Chain (default: base)', 'base')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n💰 Current Token Prices\n'));

        const tokens = options.token 
          ? [options.token.toUpperCase()]
          : ['ETH', 'WETH', 'WBTC', 'USDC', 'USDT', 'DAI'];

        const table = new Table({
          head: [chalk.bold('Token'), chalk.bold('Price (USD)'), chalk.bold('Confidence'), chalk.bold('Updated')],
          colWidths: [12, 15, 15, 20],
        });

        for (const token of tokens) {
          try {
            const price = await getTokenPrice(token, options.chain);
            table.push([
              token,
              `$${price.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`,
              price.confidence === 'high' ? chalk.green('High') : chalk.yellow('Low'),
              price.updatedAt.toLocaleTimeString(),
            ]);
          } catch (e) {
            table.push([token, chalk.red('Error'), '-', '-']);
          }
        }

        console.log(table.toString());
        console.log();
      } catch (error) {
        console.error(chalk.red('❌ Failed to fetch prices:'), error);
        process.exit(1);
      }
    });

  // Get single price
  price
    .command('get')
    .description('Get price for specific token')
    .requiredOption('-t, --token <token>', 'Token symbol (e.g., ETH)')
    .option('-c, --chain <chain>', 'Chain (default: base)', 'base')
    .action(async (options) => {
      try {
        console.log(chalk.blue(`\n💰 Fetching ${options.token.toUpperCase()} price...\n`));

        const price = await getTokenPrice(options.token, options.chain);

        console.log(chalk.cyan('Price Details:'));
        console.log(`  Token:      ${price.token}`);
        console.log(`  Price USD:  $${price.priceUSD.toLocaleString()}`);
        console.log(`  Confidence: ${price.confidence === 'high' ? chalk.green('High') : chalk.yellow('Low')}`);
        console.log(`  Updated:    ${price.updatedAt.toLocaleString()}`);
        console.log();
      } catch (error) {
        console.error(chalk.red('❌ Failed to fetch price:'), error);
        process.exit(1);
      }
    });
}
