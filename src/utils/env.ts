import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Sets up environment variables for the project
 */
export function setupEnvironmentVariables(projectPath: string): void {
  const spinner = ora('Setting up environment variables...').start();
  
  try {
    // Create .env files with your favorite environment variables
    const envLocalContent = `# Local environment variables
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_API_VERSION=v1

# App Configuration
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_NAME=${path.basename(projectPath)}
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key-change-me-in-production

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${path.basename(projectPath)}

# Feature Flags
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_DARK_MODE=true
`;

    const envExampleContent = `# Example environment variables
# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_VERSION=v1

# App Configuration
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME=${path.basename(projectPath)}
NEXT_PUBLIC_APP_URL=https://example.com

# Authentication
NEXTAUTH_URL=https://example.com
NEXTAUTH_SECRET=

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Feature Flags
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_DARK_MODE=true
`;

    const envProductionContent = `# Production environment variables
# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_API_VERSION=v1

# App Configuration
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_NAME=${path.basename(projectPath)}
NEXT_PUBLIC_APP_URL=https://example.com

# Authentication
NEXTAUTH_URL=https://example.com
NEXTAUTH_SECRET=

# Database
DATABASE_URL=

# Feature Flags
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_DARK_MODE=true
`;

    // Write environment files
    fs.writeFileSync(path.join(projectPath, '.env.local'), envLocalContent);
    fs.writeFileSync(path.join(projectPath, '.env.example'), envExampleContent);
    fs.writeFileSync(path.join(projectPath, '.env.production'), envProductionContent);
    
    // Create environment.d.ts file for TypeScript type definitions
    const envTypeDefinitions = `declare namespace NodeJS {
  interface ProcessEnv {
    // API Configuration
    NEXT_PUBLIC_API_URL: string;
    NEXT_PUBLIC_API_VERSION: string;
    
    // App Configuration
    NEXT_PUBLIC_APP_ENV: 'development' | 'test' | 'production';
    NEXT_PUBLIC_APP_NAME: string;
    NEXT_PUBLIC_APP_URL: string;
    
    // Authentication
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    
    // Database
    DATABASE_URL?: string;
    
    // Feature Flags
    NEXT_PUBLIC_FEATURE_ANALYTICS: string;
    NEXT_PUBLIC_FEATURE_DARK_MODE: string;
  }
}

export {};
`;

    // Create types directory if it doesn't exist
    const typesDir = path.join(projectPath, 'src', 'types');
    fs.ensureDirSync(typesDir);
    fs.writeFileSync(path.join(typesDir, 'environment.d.ts'), envTypeDefinitions);
    
    spinner.succeed('Environment variables set up successfully');
  } catch (error) {
    spinner.fail('Failed to set up environment variables');
    console.error(chalk.red('Error setting up environment variables:'), error);
  }
}