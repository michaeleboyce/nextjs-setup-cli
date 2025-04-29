import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';

interface GitSetupOptions {
    projectPath: string;
    projectName: string;
    owner: string;
    description?: string; // Optional description
    repository?: string; // Optional repository URL
}

export async function setupGitRepository(options: GitSetupOptions): Promise<void> {
    const { projectPath, projectName, owner, description } = options;
    const slug = `${owner}/${projectName}`;
    const gitSpinner = ora('Setting up GitHub repository and initializing local git...').start();
    let repoExists = false;
    let repoHasHistory = false;

    try {
        // Ensure GitHub CLI is installed via Homebrew
        try {
            execSync('which gh', { stdio: 'ignore' });
        } catch {
            gitSpinner.info('GitHub CLI not found. Installing via Homebrew…');
            execSync('brew install gh', { stdio: 'inherit' });
        }

        // Ensure GitHub CLI is authenticated
        try {
            execSync('gh auth status', { stdio: 'ignore' });
        } catch {
            gitSpinner.info('Not authenticated with GitHub. Launching authentication flow...');
            execSync('gh auth login --web', { stdio: 'inherit' });
        }

        // Check if GitHub repository exists
        try {
            execSync(`gh repo view ${slug}`, { stdio: 'ignore' });
            gitSpinner.info(`GitHub repository ${slug} already exists`);
            repoExists = true;
        } catch {
            gitSpinner.info(`GitHub repository ${slug} does not exist. Creating...`);
            try {
                 execSync(
                    `gh repo create ${slug} --public --description \"${description || ''}\"`,
                    { stdio: 'ignore' }
                );
                gitSpinner.succeed(`GitHub repository ${slug} created`);
                repoExists = true; // Successfully created
            } catch (createError) {
                 gitSpinner.fail(`Failed to create GitHub repository ${slug}`);
                 console.error(chalk.red('Error creating GitHub repository:'), createError);
                 // Decide how to handle creation failure - maybe exit or skip git steps
                 throw createError; // Re-throw to be caught by the outer catch block
            }
        }

        // Initialize local git repository regardless of remote state first
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        // Use SSH remote URL by default, but allow override via options.repository
        const remoteUrl = options.repository || `git@github.com:${slug}.git`;
        try {
            execSync(`git remote add origin ${remoteUrl}`, {
                cwd: projectPath,
                stdio: 'ignore' // Keep ignore initially to avoid noise if it fails (e.g., remote exists)
            });
        } catch (remoteAddError: any) {
             // Ignore error if remote 'origin' already exists (e.g., create-next-app added it)
            if (!remoteAddError.message.includes("remote origin already exists")) {
                gitSpinner.warn(`Could not add remote origin: ${remoteAddError.message}`);
                // Decide if this is critical enough to stop
            }
             // Try setting the URL instead if it exists
            try {
                 execSync(`git remote set-url origin ${remoteUrl}`, { cwd: projectPath, stdio: 'ignore' });
            } catch (setUrlError) {
                 gitSpinner.fail(`Failed to set remote URL origin`);
                 console.error(chalk.red('Error setting remote URL:'), setUrlError);
                 throw setUrlError;
            }
        }

        // Check if the existing remote repo has history
        if (repoExists) {
            try {
                execSync('git fetch origin', { cwd: projectPath, stdio: 'ignore' });
                const remoteHeads = execSync('git ls-remote --heads origin', { cwd: projectPath }).toString().trim();
                if (remoteHeads) {
                    repoHasHistory = true;
                    gitSpinner.warn(`Remote repository ${slug} has existing history.`);
                }
            } catch (fetchError) {
                // If fetch fails, might indicate access issues or repo truly empty/just created
                 gitSpinner.warn(`Could not fetch from remote repository: ${fetchError}`);
                 // Assume no history or proceed carefully
                 repoHasHistory = false;
            }
        }

        // Prompt user if repo exists and has history
        let proceedWithPush = true;
        let forcePush = false;
        if (repoExists && repoHasHistory) {
            const { action } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: `Repository ${slug} already exists and has history. What do you want to do?`,
                    choices: [
                        { name: 'Overwrite remote history (force push)', value: 'overwrite' },
                        { name: 'Cancel Git setup', value: 'cancel' }
                        // { name: 'Attempt to pull and merge (experimental)', value: 'pull' } // Future option?
                    ],
                    default: 'cancel'
                }
            ]);

            if (action === 'overwrite') {
                gitSpinner.info('Proceeding with force push.');
                forcePush = true;
            } else { // action === 'cancel'
                gitSpinner.info('Git setup cancelled by user.');
                proceedWithPush = false;
                // Clean up local git init? Optional. For now, just skip the push.
                 execSync('rm -rf .git', { cwd: projectPath, stdio: 'ignore' }); // Remove local git artifacts
                 gitSpinner.succeed('Local git initialization removed.');
            }
        }

        if (proceedWithPush) {
             // Add and commit changes
             try {
                 execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
                 // Check if there are changes to commit
                 const status = execSync('git status --porcelain', { cwd: projectPath }).toString().trim();
                 if (status) {
                     execSync(
                        'git commit -m "Initial commit: Setup Next.js project"',
                        { cwd: projectPath, stdio: 'ignore' }
                     );
                     gitSpinner.info('Committed initial project setup.');
                 } else {
                     gitSpinner.info('No changes to commit.');
                     // If there's no initial commit AND we are not overwriting, we might not need to push.
                     // However, create-next-app might have made the first commit.
                     // Let's check if HEAD exists before trying to push.
                     try {
                         execSync('git rev-parse HEAD', { cwd: projectPath, stdio: 'ignore' });
                     } catch (noHeadError) {
                         gitSpinner.info('No commit found. Skipping push.');
                         proceedWithPush = false; // Don't push if there's nothing to push
                     }
                 }
             } catch (commitError) {
                 gitSpinner.fail('Failed to add or commit changes.');
                 console.error(chalk.red('Git commit error:'), commitError);
                 throw commitError;
             }
         }

        if (proceedWithPush) {
             // Push changes to GitHub
             const pushCommand = `git push ${forcePush ? '--force ' : ''}-u origin HEAD`;
             gitSpinner.start(`Pushing changes to GitHub${forcePush ? ' (force)' : ''}...`);
             try {
                 execSync(pushCommand, {
                     cwd: projectPath,
                     stdio: 'inherit' // Show output for confirmation or errors
                 });
                 gitSpinner.succeed(`Local git initialized and ${forcePush ? 'force ' : ''}pushed to GitHub`);
             } catch (pushError) {
                 gitSpinner.fail(`Failed to ${forcePush ? 'force ' : ''}push to GitHub repository`);
                 console.error(chalk.red(`Error during \`${pushCommand}\`:`), pushError);
                 throw pushError; // Re-throw to be caught by the outer catch block
             }
        }

    } catch (error) {
        // Only fail the spinner if it hasn't already succeeded or failed meaningfully
        if (gitSpinner.isSpinning) {
             gitSpinner.fail('Failed to set up git and GitHub repository');
        }
        console.error(
            chalk.red('Error setting up git and GitHub repository:'),
            error
        );
        // Optionally re-throw or handle the error further if needed
        // throw error;
    }
}