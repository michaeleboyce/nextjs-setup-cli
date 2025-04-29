import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Sets up custom files for the project
 */
export function setupCustomFiles(projectPath: string): void {
  const spinner = ora('Setting up custom files...').start();
  
  try {
    // Create .gitignore file with appropriate content
    const gitignoreContent = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage
/.nyc_output

# next.js
/.next/
/out/

# production
/build
/dist

# misc
.DS_Store
*.pem
.idea/
.vscode/
*.swp
*.swo

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env.local
.env
.env.development
.env.production
.env.example
**/*.env*


# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# cache
.eslintcache
.stylelintcache

# logs
logs/
*.log
`;

    // Create CLAUDE.md file
    const claudeMdContent = `# CLAUDE

This project was set up using a custom Next.js CLI tool.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- \`app/\`: Next.js App Router
- \`components/\`: Reusable UI components
- \`public/\`: Static assets
- \`styles/\`: Global styles
- \`types/\`: TypeScript type definitions
- \`utils/\`: Utility functions
- \`lib/\`: Library code and third-party integrations

## Environment Variables

See \`.env.example\` for all available environment variables.

## Common Commands

- \`npm run dev\`: Start development server
- \`npm run build\`: Build for production
- \`npm run start\`: Start production server
- \`npm run lint\`: Run ESLint
- \`npm run test\`: Run tests

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
`;

    // Create a README.md file
    const readmeContent = `# ${path.basename(projectPath)}

This is a [Next.js](https://nextjs.org/) project bootstrapped with a custom CLI tool.

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

This project uses environment variables for configuration. See \`.env.example\` for available options.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).
`;

    // Create a VSCode configuration for better developer experience
    const vscodeFolderPath = path.join(projectPath, '.vscode');
    fs.ensureDirSync(vscodeFolderPath);
    
    const settingsContent = `{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}`;
    
    // Write files
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent);
    fs.writeFileSync(path.join(projectPath, 'CLAUDE.md'), claudeMdContent);
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);
    fs.writeFileSync(path.join(vscodeFolderPath, 'settings.json'), settingsContent);
    
    spinner.succeed('Custom files set up successfully');
  } catch (error) {
    spinner.fail('Failed to set up custom files');
    console.error(chalk.red('Error setting up custom files:'), error);
  }
}