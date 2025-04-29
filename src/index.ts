#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import { setupEnvironmentVariables } from './utils/env';
import { setupCustomFiles } from './utils/files';
import { setupGitRepository } from './utils/git';

const program = new Command();

// Define CLI version and description
program
    .version('1.0.0')
    .description('A CLI tool to set up a Next.js project with custom settings');

// Define command options
program
    .argument('<project-name>', 'Name of the project')
    .option('-d, --description <description>', 'Project description')
    .option('-r, --repository <url>', 'GitHub repository URL')
    .option('-o, --owner <owner>', 'GitHub repository owner', 'michaeleboyce')
    .option('--skip-git', 'Skip git initialization')
    .option('--skip-install', 'Skip npm install')
    .action(async (projectName: string, options: { repository: string, skipGit: boolean, description: string, skipInstall: boolean, owner: string }) => {
        try {
            console.log(chalk.blue.bold('🚀 Setting up your Next.js project...'));

            // Create project directory
            const projectPath = path.resolve(process.cwd(), projectName);

            // Check if directory already exists
            if (fs.existsSync(projectPath)) {
                const { overwrite } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'overwrite',
                        message: `Directory ${projectName} already exists. Overwrite?`,
                        default: false
                    }
                ]);

                if (!overwrite) {
                    console.log(chalk.yellow('Setup cancelled.'));
                    process.exit(0);
                }

                fs.removeSync(projectPath);
            }

            // Create project directory
            fs.mkdirSync(projectPath);

            // Create Next.js app
            const spinner = ora('Creating Next.js app...').start();
            try {
                execSync(
                    `npx create-next-app@latest ${projectName} --typescript --eslint --tailwind --app --src-dir --import-alias "@/*"`,
                    { stdio: 'inherit' }
                );
                spinner.succeed('Next.js app created successfully');
            } catch (error) {
                spinner.fail('Failed to create Next.js app');
                console.error(chalk.red('Error creating Next.js app:'), error);
                process.exit(1);
            }

            // Setup environment variables
            setupEnvironmentVariables(projectPath);

            // Setup custom files
            setupCustomFiles(projectPath);

            if (!options.skipGit) {
                await setupGitRepository({
                    projectPath,
                    projectName,
                    owner: options.owner,
                    description: options.description,
                    repository: options.repository
                });
            }

            if (!options.skipInstall) {
                // Install dependencies
                const installSpinner = ora('Installing dependencies...').start();
                try {
                    execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
                    installSpinner.succeed('Dependencies installed successfully');
                } catch (error) {
                    installSpinner.fail('Failed to install dependencies');
                    console.error(chalk.red('Error installing dependencies:'), error);
                }
            }

            console.log(chalk.green.bold('✅ Project setup completed successfully!'));
            console.log(chalk.cyan(`\nTo start your project:`));
            console.log(chalk.white(`  cd ${projectName}`));
            console.log(chalk.white('  npm run dev'));

        } catch (error) {
            console.error(chalk.red('An error occurred:'), error);
            process.exit(1);
        }
    });

// See implementation in ./utils/env.ts, ./utils/files.ts, and ./utils/git.ts

// Parse arguments
program.parse(process.argv);