# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GraphQL backend application built with Express, Apollo Server 4, and MongoDB. It implements a lyrical database with user authentication using Passport.js. The application manages songs, lyrics, and user accounts with session-based authentication.

## Development Commands

### Setup Environment Variables
Before running the application, create a `.env` file from the template:
```bash
cp .env.example .env
```
Then edit `.env` and fill in your actual MongoDB connection string and other configuration values.

### Installation
```bash
npm install --legacy-peer-deps
```
Note: The `--legacy-peer-deps` flag is required due to dependency compatibility issues.

### Running the Application
```bash
npm start              # Production mode (port 4000 by default)
npm run dev            # Development mode with nodemon
```

The application runs on `http://localhost:4000` (configurable via PORT environment variable) with Apollo Sandbox interface available at `/graphql`.

## Architecture

### Application Entry Point
- `index.js` - Main entry point that configures Apollo Server 4 and starts the Express server
  - Creates Apollo Server instance with schema
  - Applies expressMiddleware with CORS and body parser
  - Configures context to pass request/response objects for authentication
  - Async startup pattern (required in Apollo Server 4)
- `server/server.js` - Core Express app configuration with sessions and Passport
  - Loads environment variables via dotenv
  - Configures MongoDB connection
  - Sets up Express sessions with MongoDB store
  - Initializes Passport middleware
  - Exports both app and schema for Apollo Server setup

### Authentication System
The application uses Passport.js with local strategy for authentication:
- `server/services/auth.js` - Passport configuration and authentication logic
  - `signup()` - Creates new user accounts with hashed passwords
  - `login()` - Authenticates users via Passport local strategy
  - Session serialization/deserialization for user persistence
- `server/models/User.js` - User model with bcrypt password hashing
  - Pre-save hook automatically hashes passwords using bcrypt
  - `comparePassword()` method for authentication validation

### Session Management
- Express sessions stored in MongoDB via connect-mongo
- Session secret loaded from SESSION_SECRET environment variable
- MongoDB connection configured via MONGODB_URI environment variable
- Passport deserializes user from session and attaches to `req.user`
- Session middleware runs before Apollo Server middleware to ensure authentication context

### GraphQL Schema Architecture
The GraphQL schema is organized into separate files:
- `server/schema/schema.js` - Main schema export combining queries and mutations
- `server/schema/root_query_type.js` - Root query definitions (songs, song, lyric, user)
- `server/schema/mutations.js` - All mutations (signup, login, logout, addSong, addLyricToSong, likeLyric, deleteSong)
- `server/schema/*_type.js` - GraphQL type definitions for Song, Lyric, and User

### Data Models
Three main Mongoose models with relationships:
- `server/models/User.js` - User accounts with email/password
- `server/models/song.js` - Songs with title and references to lyrics
  - `addLyric(id, content)` static method - Creates lyric and associates with song
  - `findLyrics(id)` static method - Populates and returns song's lyrics
- `server/models/lyric.js` - Lyrics with content, likes count, and song reference
  - `like(id)` static method - Increments like count

### Model Relationships
- Songs have a many-to-many relationship with lyrics (song.lyrics array of ObjectIds)
- Lyrics reference their parent song (lyric.song ObjectId)
- Songs can optionally reference a user (song.user ObjectId)

### GraphQL Context
The GraphQL context includes both request and response objects (`context.req`, `context.res`):
- `req.user` - Currently authenticated user (populated by Passport)
- `req` - Full Express request object with session data
- `res` - Express response object
- Used in mutations for authentication operations (signup, login, logout)
- Used in queries to return current user information
- Context is configured as an async function in Apollo Server expressMiddleware

## Environment Variables

The application uses the following environment variables (configured in `.env` file):

### Required Variables:
- **MONGODB_URI** - MongoDB connection string (MongoDB Atlas or local instance)
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/database`
- **SESSION_SECRET** - Secret key for Express session encryption
  - Should be a long random string in production

### Optional Variables:
- **PORT** - Server port number (default: 4000)
- **NODE_ENV** - Environment mode (development/production)

### Security Notes:
- `.env` file is gitignored and never committed to version control
- Use `.env.example` as a template for required variables
- Rotate SESSION_SECRET regularly in production
- Use strong, unique passwords for MongoDB connection

## Node Version Requirement
Requires Node.js >= 18.x (specified in package.json engines field)
