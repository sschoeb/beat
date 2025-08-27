# Table Match Manager - Setup Instructions

## Prerequisites

- Node.js (v20.18+)
- MySQL Database
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` file with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=table_match_db
   PORT=3000
   ```

5. Create MySQL database:
   ```sql
   CREATE DATABASE table_match_db;
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will automatically:
- Test the database connection
- Create tables if they don't exist
- Insert sample persons data
- Start the API server on port 3000

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend/table-match-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:4200
   ```

## API Endpoints

The backend provides the following endpoints:

### Persons
- `GET /api/persons` - Get all persons
- `POST /api/persons` - Create a new person

### Matches
- `GET /api/matches/current` - Get current active match
- `POST /api/matches/start` - Start a new match
- `POST /api/matches/end` - End a match with winner

### Queue
- `GET /api/queue` - Get challenge queue
- `POST /api/queue` - Add team to queue
- `GET /api/queue/next` - Get and remove next team from queue
- `DELETE /api/queue/:id` - Remove specific team from queue

## Features

- **Player Management**: Fixed list of players stored in MySQL database
- **Match Creation**: Support for 1v1 or 2v2 matches
- **Queue System**: Teams can challenge winners and join a queue
- **Automatic Match Progression**: Winners continue playing against next team in queue
- **Strict TypeScript**: No `any` types used throughout the application

## Usage

1. **Start a Match**: Select players for Team 1 and Team 2, then click "Start Match"
2. **End a Match**: Click the winner button to end the current match
3. **Join Queue**: Select players and click "Add to Queue" to challenge the current winner
4. **Automatic Progression**: When a match ends, the next team in queue automatically plays against the winner

## Database Schema

The application uses three main tables:
- `persons`: Stores player information
- `matches`: Stores match data with team compositions and results
- `queue`: Stores teams waiting to challenge