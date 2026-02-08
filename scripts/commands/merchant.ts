import { Command } from 'commander';
import { db } from '@/lib/db';
import chalk from 'chalk';
import Table from 'cli-table3';

export function merchantCommands(program: Command) {
  const merchant = program.command('merchant')
    .description('Merchant management commands');

  // Create merchant
  merchant
    .command('create')
    .description('Create a new merchant')
    .requiredOption('-n, --name <name>', 'Merchant name')
    .requiredOption('-w, --wallet <address>', 'Merchant wallet address')
    .requiredOption('-o, --origin <origin>', 'Allowed origin (e.g., https://mystore.com)')
    .option('-e, --email <email>', 'Contact email')
    .option('--website <url>', 'Website URL')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🏪 Creating new merchant...\n'));

        const merchant = await db.merchants.create({
          name: options.name,
          walletAddress: options.wallet,
          allowedOrigins: [options.origin],
        });

        // Update optional fields if provided
        if (options.email || options.website) {
          await db.prisma.merchant.update({
            where: { id: merchant.id },
            data: {
              ...(options.email && { email: options.email }),
              ...(options.website && { website: options.website }),
            },
          });
        }

        console.log(chalk.green('✅ Merchant created successfully!\n'));
        console.log(chalk.cyan('Merchant Details:'));
        console.log(`  ID:       ${merchant.id}`);
        console.log(`  Name:     ${merchant.name}`);
        console.log(`  Wallet:   ${merchant.walletAddress}`);
        console.log(`  API Key:  ${merchant.apiKey}`);
        console.log(`  Origins:  ${merchant.allowedOrigins.join(', ')}`);
        console.log(`  Status:   ${merchant.isActive ? 'Active' : 'Inactive'}`);
        console.log(`  Created:  ${merchant.createdAt.toLocaleString()}\n`);

        console.log(chalk.yellow('⚠️  Save the API Key securely - it will not be shown again!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to create merchant:'), error);
        process.exit(1);
      }
    });

  // List merchants
  merchant
    .command('list')
    .description('List all merchants')
    .option('-a, --active', 'Show only active merchants')
    .option('-l, --limit <number>', 'Limit number of results', '50')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n📋 Fetching merchants...\n'));

        let merchants = await db.merchants.list();

        if (options.active) {
          merchants = merchants.filter(m => m.isActive);
        }

        merchants = merchants.slice(0, parseInt(options.limit));

        if (merchants.length === 0) {
          console.log(chalk.yellow('No merchants found.\n'));
          return;
        }

        const table = new Table({
          head: [chalk.bold('ID'), chalk.bold('Name'), chalk.bold('Wallet'), chalk.bold('Status'), chalk.bold('Created')],
          colWidths: [20, 20, 20, 10, 20],
        });

        merchants.forEach(m => {
          table.push([
            m.id,
            m.name.slice(0, 17) + (m.name.length > 17 ? '...' : ''),
            `${m.walletAddress.slice(0, 6)}...${m.walletAddress.slice(-4)}`,
            m.isActive ? chalk.green('Active') : chalk.red('Inactive'),
            m.createdAt.toLocaleDateString(),
          ]);
        });

        console.log(table.toString());
        console.log(chalk.gray(`\nShowing ${merchants.length} merchant(s)\n`));
      } catch (error) {
        console.error(chalk.red('❌ Failed to list merchants:'), error);
        process.exit(1);
      }
    });

  // Show merchant details
  merchant
    .command('show')
    .description('Show merchant details')
    .requiredOption('-i, --id <id>', 'Merchant ID')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🔍 Fetching merchant details...\n'));

        const merchant = await db.merchants.findById(options.id);

        if (!merchant) {
          console.log(chalk.red(`❌ Merchant not found: ${options.id}\n`));
          process.exit(1);
        }

        console.log(chalk.cyan('Merchant Details:'));
        console.log(`  ID:              ${merchant.id}`);
        console.log(`  Name:            ${merchant.name}`);
        console.log(`  Wallet:          ${merchant.walletAddress}`);
        console.log(`  API Key:         ${merchant.apiKey.slice(0, 12)}...`);
        console.log(`  Allowed Origins: ${merchant.allowedOrigins.join(', ')}`);
        console.log(`  Status:          ${merchant.isActive ? chalk.green('Active') : chalk.red('Inactive')}`);
        console.log(`  Verified:        ${merchant.isVerified ? chalk.green('Yes') : chalk.yellow('No')}`);
        console.log(`  Created:         ${merchant.createdAt.toLocaleString()}`);
        console.log(`  Updated:         ${merchant.updatedAt.toLocaleString()}\n`);

        // Get loan count
        const loans = await db.loans.findByMerchant(merchant.id);
        console.log(chalk.cyan('Activity:'));
        console.log(`  Total Loans:     ${loans.length}\n`);
      } catch (error) {
        console.error(chalk.red('❌ Failed to fetch merchant:'), error);
        process.exit(1);
      }
    });

  // Update merchant
  merchant
    .command('update')
    .description('Update merchant settings')
    .requiredOption('-i, --id <id>', 'Merchant ID')
    .option('-n, --name <name>', 'New name')
    .option('-o, --origin <origin>', 'Add allowed origin')
    .option('--remove-origin <origin>', 'Remove allowed origin')
    .option('--activate', 'Activate merchant')
    .option('--deactivate', 'Deactivate merchant')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n✏️  Updating merchant...\n'));

        const merchant = await db.merchants.findById(options.id);
        if (!merchant) {
          console.log(chalk.red(`❌ Merchant not found: ${options.id}\n`));
          process.exit(1);
        }

        const updateData: any = {};

        if (options.name) updateData.name = options.name;
        if (options.activate) updateData.isActive = true;
        if (options.deactivate) updateData.isActive = false;

        if (options.origin) {
          updateData.allowedOrigins = [...merchant.allowedOrigins, options.origin];
        }

        if (options.removeOrigin) {
          updateData.allowedOrigins = merchant.allowedOrigins.filter(o => o !== options.removeOrigin);
        }

        await db.prisma.merchant.update({
          where: { id: options.id },
          data: updateData,
        });

        console.log(chalk.green('✅ Merchant updated successfully!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to update merchant:'), error);
        process.exit(1);
      }
    });

  // Delete merchant
  merchant
    .command('delete')
    .description('Delete a merchant (⚠️ destructive)')
    .requiredOption('-i, --id <id>', 'Merchant ID')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      try {
        if (!options.force) {
          console.log(chalk.yellow('\n⚠️  Warning: This will permanently delete the merchant!\n'));
          console.log(chalk.gray('Use --force to skip this confirmation\n'));
          process.exit(1);
        }

        console.log(chalk.blue('\n🗑️  Deleting merchant...\n'));

        await db.prisma.merchant.delete({
          where: { id: options.id },
        });

        console.log(chalk.green('✅ Merchant deleted successfully!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to delete merchant:'), error);
        process.exit(1);
      }
    });

  // Rotate API key
  merchant
    .command('rotate-key')
    .description('Rotate merchant API key')
    .requiredOption('-i, --id <id>', 'Merchant ID')
    .action(async (options) => {
      try {
        console.log(chalk.blue('\n🔄 Rotating API key...\n'));

        const newKey = `key_${require('uuid').v4().replace(/-/g, '')}`;

        await db.prisma.merchant.update({
          where: { id: options.id },
          data: { apiKey: newKey },
        });

        console.log(chalk.green('✅ API key rotated successfully!\n'));
        console.log(chalk.cyan('New API Key:'), newKey);
        console.log(chalk.yellow('\n⚠️  Save this key securely - it will not be shown again!\n'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to rotate API key:'), error);
        process.exit(1);
      }
    });
}
