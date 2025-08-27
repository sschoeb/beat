const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

function cleanDirectory(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
}

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        fs.readdirSync(src).forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

async function build() {
    console.log('🔨 Starting build process...\n');
    
    try {
        // Step 1: Clean dist directory
        console.log('📁 Cleaning dist directory...');
        cleanDirectory(distDir);
        fs.mkdirSync(path.join(distDir, 'frontend'), { recursive: true });
        fs.mkdirSync(path.join(distDir, 'backend'), { recursive: true });
        fs.mkdirSync(path.join(distDir, 'db'), { recursive: true });
        
        // Step 2: Build Backend
        console.log('\n📦 Building backend...');
        const backendDir = path.join(rootDir, 'table-match-manager', 'backend');
        process.chdir(backendDir);
        
        console.log('  Installing backend dependencies...');
        execSync('npm install', { stdio: 'inherit' });
        
        console.log('  Compiling TypeScript...');
        execSync('npm run build', { stdio: 'inherit' });
        
        console.log('  Copying backend build files...');
        const backendDistSrc = path.join(backendDir, 'dist');
        const backendDistDest = path.join(distDir, 'backend');
        copyRecursive(backendDistSrc, backendDistDest);
        
        // Copy package.json and package-lock.json for production dependencies
        fs.copyFileSync(
            path.join(backendDir, 'package.json'),
            path.join(distDir, 'backend', 'package.json')
        );
        fs.copyFileSync(
            path.join(backendDir, 'package-lock.json'),
            path.join(distDir, 'backend', 'package-lock.json')
        );
        
        // Step 3: Build Frontend
        console.log('\n📦 Building frontend...');
        const frontendDir = path.join(rootDir, 'table-match-manager', 'frontend', 'table-match-frontend');
        process.chdir(frontendDir);
        
        console.log('  Installing frontend dependencies...');
        execSync('npm install', { stdio: 'inherit' });
        
        console.log('  Building Angular app for production...');
        execSync('npm run build:prod', { stdio: 'inherit' });
        
        console.log('  Copying frontend build files...');
        const frontendDistSrc = path.join(frontendDir, 'dist', 'table-match-frontend');
        const frontendDistDest = path.join(distDir, 'frontend');
        
        // Angular build output is in dist/table-match-frontend/browser
        const browserPath = path.join(frontendDistSrc, 'browser');
        if (fs.existsSync(browserPath)) {
            copyRecursive(browserPath, frontendDistDest);
        } else if (fs.existsSync(frontendDistSrc)) {
            copyRecursive(frontendDistSrc, frontendDistDest);
        }
        
        // Step 4: Copy Database files
        console.log('\n📦 Copying database setup files...');
        
        // Copy schema files from backend
        const backendSchemaFile = path.join(rootDir, 'table-match-manager', 'backend', 'src', 'database', 'schema.sql');
        if (fs.existsSync(backendSchemaFile)) {
            fs.copyFileSync(backendSchemaFile, path.join(distDir, 'db', 'schema.sql'));
        }
        
        // Copy database init and migration files
        const dbDir = path.join(rootDir, 'table-match-manager', 'database');
        if (fs.existsSync(dbDir)) {
            const initDir = path.join(dbDir, 'init');
            const migrationDir = path.join(dbDir, 'migration');
            
            if (fs.existsSync(initDir)) {
                copyRecursive(initDir, path.join(distDir, 'db', 'init'));
            }
            
            if (fs.existsSync(migrationDir)) {
                copyRecursive(migrationDir, path.join(distDir, 'db', 'migration'));
            }
        }
        
        // Step 5: Create production package.json for the dist folder
        console.log('\n📝 Creating production package.json...');
        const productionPackageJson = {
            name: "table-match-manager-production",
            version: "1.0.0",
            description: "Table Match Manager - Production Build",
            scripts: {
                "start": "cd backend && node index.js",
                "install:backend": "cd backend && npm ci --production"
            },
            author: "TFCZ",
            license: "MIT"
        };
        
        fs.writeFileSync(
            path.join(distDir, 'package.json'),
            JSON.stringify(productionPackageJson, null, 2)
        );
        
        // Step 6: Create README for dist
        const readmeContent = `# Table Match Manager - Production Build

## Directory Structure

- **frontend/** - Compiled Angular application files (HTML, CSS, JS)
- **backend/** - Compiled Node.js backend files
- **db/** - Database schema and migration files

## Deployment

1. Install backend production dependencies:
   \`\`\`bash
   cd backend
   npm ci --production
   \`\`\`

2. Set up environment variables for the backend (create .env file in backend/)

3. Initialize the database using files in db/

4. Start the backend server:
   \`\`\`bash
   cd backend
   node index.js
   \`\`\`

5. Serve the frontend files using a web server (nginx, apache, etc.)
`;
        
        fs.writeFileSync(path.join(distDir, 'README.md'), readmeContent);
        
        // Return to root directory
        process.chdir(rootDir);
        
        console.log('\n✅ Build completed successfully!');
        console.log(`📁 Output directory: ${distDir}`);
        console.log('\nDirectory structure:');
        console.log('  dist/');
        console.log('  ├── frontend/     (Angular build files)');
        console.log('  ├── backend/      (Node.js build files)');
        console.log('  ├── db/           (Database setup files)');
        console.log('  ├── package.json  (Production package.json)');
        console.log('  └── README.md     (Deployment instructions)');
        
    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run the build
build();