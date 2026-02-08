#!/usr/bin/env tsx
/**
 * LoanFi CLI - Administrative Tools
 * 
 * Usage: npm run cli -- [command] [options]
 * 
 * Commands:
 *   merchant:create    Create a new merchant
 *   merchant:list      List all merchants
 *   merchant:show      Show merchant details
 *   merchant:update    Update merchant settings
 *   merchant:delete    Delete a merchant
 *   
 *   pool:list          List lending pools
 *   pool:update        Update pool rates
 *   pool:add           Add new pool
 *   
 *   loan:list          List all loans
 *   loan:show          Show loan details
 *   loan:stats         Show loan statistics
 *   
 *   price:update       Refresh token prices
 *   price:show         Show current prices
 *   
 *   db:seed            Seed database with test data
 *   db:reset           Reset database (⚠️ destructive)
 *   
 *   report:daily       Generate daily report
 *   report:merchant    Generate merchant report
 * 
 * Examples:
 *   npm run cli -- merchant:create --name "My Store" --wallet 0x123...
 *   npm run cli -- merchant:list
 *   npm run cli -- loan:stats
 *   npm run cli -- price:update
 */

import { program } from 'commander';
import { merchantCommands } from './commands/merchant';
import { poolCommands } from './commands/pool';
import { loanCommands } from './commands/loan';
import { priceCommands } from './commands/price';
import { dbCommands } from './commands/db';
import { reportCommands } from './commands/report';

// CLI Metadata
program
  .name('loanfi')
  .description('LoanFi Administrative CLI')
  .version('0.1.0');

// Register command modules
merchantCommands(program);
poolCommands(program);
loanCommands(program);
priceCommands(program);
dbCommands(program);
reportCommands(program);

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
