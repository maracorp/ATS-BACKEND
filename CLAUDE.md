# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GraphQL backend application built with Express, Apollo Server, and MongoDB. It implements a lyrical database with user authentication using Passport.js. The application manages songs, lyrics, and user accounts with session-based authentication.

## Development Commands

### Installation
```bash
npm install --legacy-peer-deps
```
Note: The `--legacy-peer-deps` flag is required due to dependency compatibility issues.

### Running the Application
```bash
npm start              # Production mode (port 4000)
npm run dev            # Development mode with nodemon
```

The application runs on `http://localhost:4000` with GraphiQL interface available at `/graphql`.

## Architecture

### Application Entry Point
- `index.js` - Main entry point that starts the Express server on port 4000
- `server/server.js` - Core Express and Apollo Server configuration

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
- Session secret and MongoDB connection configured in `server/server.js`
- Passport deserializes user from session and attaches to `req.user`

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
The GraphQL context includes the Express request object (`context.req`), which provides:
- `req.user` - Currently authenticated user (populated by Passport)
- Used in mutations for authentication operations (signup, login, logout)
- Used in queries to return current user information

## Important Configuration Notes

**WARNING**: The MongoDB connection string and session secret are currently hardcoded in `server/server.js`. In production, these should be moved to environment variables:
- MongoDB Atlas URI (line 16-17)
- Session secret (line 39)
- MongoStore connection (line 42-43)

## Node Version Requirement
Requires Node.js >= 18.x (specified in package.json engines field)
