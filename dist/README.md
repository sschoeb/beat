# Table Match Manager - Production Build

## Directory Structure

- **frontend/** - Compiled Angular application files (HTML, CSS, JS)
- **backend/** - Compiled Node.js backend files
- **db/** - Database schema and migration files

## Deployment

1. Install backend production dependencies:
   ```bash
   cd backend
   npm ci --production
   ```

2. Set up environment variables for the backend (create .env file in backend/)

3. Initialize the database using files in db/

4. Start the backend server:
   ```bash
   cd backend
   node index.js
   ```

5. Serve the frontend files using a web server (nginx, apache, etc.)
