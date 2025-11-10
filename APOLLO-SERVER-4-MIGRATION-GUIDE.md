# Apollo Server 4 Migration Guide

## Table of Contents
1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Overview of Changes](#overview-of-changes)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Code Changes Reference](#code-changes-reference)
5. [Testing Plan](#testing-plan)
6. [Rollback Plan](#rollback-plan)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Migration Checklist

### Before Starting:
- [ ] Backup current working code: `git commit -am "Backup before Apollo 4 migration"`
- [ ] Create feature branch: `git checkout -b feature/apollo-server-4`
- [ ] Ensure all tests are passing (if any exist)
- [ ] Document current GraphQL endpoint behavior
- [ ] Test current authentication flow manually
- [ ] Verify MongoDB connection is working
- [ ] Note current npm script commands

### Time Estimate: 3-4 hours total
- Setup: 30 minutes
- Code changes: 2 hours
- Testing: 1-1.5 hours

---

## Overview of Changes

### What's Changing:
1. **Package removal:**
   - ❌ Remove `apollo-server-express@3.13.0`
   - ❌ Remove `express-graphql@0.12.0`

2. **Package addition:**
   - ✅ Add `@apollo/server@^4.11.0`

3. **File modifications:**
   - `package.json` - Update dependencies
   - `server/server.js` - Restructure Express app
   - `index.js` - Add async startup
   - New file: `server/apollo-config.js` (optional but recommended)

4. **Architecture changes:**
   - Synchronous → Asynchronous server startup
   - Middleware pattern changes
   - Context function signature update
   - GraphiQL → Apollo Sandbox

### What's NOT Changing:
- ✅ GraphQL schema files (no changes needed)
- ✅ Mongoose models (no changes needed)
- ✅ Authentication logic (no changes needed)
- ✅ Session management (no changes needed)
- ✅ Passport configuration (no changes needed)

---

## Step-by-Step Migration

### Step 1: Update Dependencies (5 minutes)

#### 1.1 Update package.json

**Current dependencies section:**
```json
"dependencies": {
  "apollo-server-express": "^3.13.0",
  "bcrypt": "^5.1.1",
  "body-parser": "^1.20.3",
  "connect-mongo": "^5.1.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.18.2",
  "express-graphql": "^0.12.0",
  "express-session": "^1.18.1",
  "graphql": "^16.8.1",
  "mongoose": "^8.15.1",
  "passport": "^0.7.0",
  "passport-local": "^1.0.0"
}
```

**New dependencies section:**
```json
"dependencies": {
  "@apollo/server": "^4.11.0",
  "bcrypt": "^5.1.1",
  "body-parser": "^1.20.3",
  "connect-mongo": "^5.1.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.18.2",
  "express-session": "^1.18.1",
  "graphql": "^16.8.1",
  "mongoose": "^8.15.1",
  "passport": "^0.7.0",
  "passport-local": "^1.0.0"
}
```

**Changes:**
- Removed: `apollo-server-express`
- Removed: `express-graphql`
- Added: `@apollo/server`

#### 1.2 Install dependencies

```bash
npm install --legacy-peer-deps
```

**Expected output:** Should install ~300 packages without errors.

**Verification:**
```bash
npm list @apollo/server
# Should show: @apollo/server@4.x.x
```

---

### Step 2: Restructure server/server.js (30 minutes)

#### 2.1 Update imports at the top of the file

**OLD (Lines 1-10):**
```javascript
const express = require("express");
const models = require("./models");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const schema = require("./schema/schema");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./services/auth");
const MongoStore = require("connect-mongo");
const { graphqlHTTP } = require("express-graphql");
```

**NEW:**
```javascript
const express = require("express");
const models = require("./models");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const schema = require("./schema/schema");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./services/auth");
const MongoStore = require("connect-mongo");
```

**Changes:**
- ❌ Removed: `const { graphqlHTTP } = require("express-graphql");`
- ✅ Added: `const cors = require("cors");`

#### 2.2 Keep MongoDB connection (NO CHANGES)

**Lines 14-27 remain exactly the same:**
```javascript
const MONGO_URI =
  "mongodb+srv://nalinisunderrajan:35WvuAG7jwigSU9c@cluster0.xb7gcok.mongodb.net/lyricalauth?retryWrites=true&w=majority&appName=Cluster0";
if (!MONGO_URI) {
  throw new Error("You must provide a Mongo Atlas URI");
}

mongoose.Promise = global.Promise;
mongoose.connect(MONGO_URI);
mongoose.connection
  .once("open", () => console.log("Connected to Mongo Atlas instance."))
  .on("error", (error) =>
    console.log("Error connecting to Mongo Atlas:", error)
  );
```

#### 2.3 Keep session and passport middleware (NO CHANGES)

**Lines 34-51 remain exactly the same:**
```javascript
app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: "aaabbbccc",
    store: MongoStore.create({
      dbName: "lyricalauth",
      mongoUrl:
        "mongodb+srv://nalinisunderrajan:35WvuAG7jwigSU9c@cluster0.xb7gcok.mongodb.net/lyricalauth",
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());
```

#### 2.4 Remove GraphQL middleware, export app and schema

**OLD (Lines 53-62):**
```javascript
app.use(
  "/graphql",
  graphqlHTTP((req) => ({
    schema,
    graphiql: true,
    context: { req },
  }))
);

module.exports = app;
```

**NEW:**
```javascript
// Export both app and schema for Apollo Server setup in index.js
module.exports = { app, schema };
```

**Changes:**
- ❌ Removed: GraphQL middleware (will be added in index.js)
- ✅ Changed: Export both `app` and `schema` instead of just `app`

---

### Step 3: Update index.js for Apollo Server 4 (45 minutes)

#### 3.1 Complete new index.js

**OLD index.js:**
```javascript
const app = require('./server/server');

app.listen(4000, () => {
  console.log('Listening');
});
```

**NEW index.js:**
```javascript
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");
const bodyParser = require("body-parser");
const { app, schema } = require("./server/server");

// Create Apollo Server instance
const server = new ApolloServer({
  schema,
  // Optional: Custom error formatting
  formatError: (formattedError, error) => {
    // Don't expose internal server errors to clients in production
    if (process.env.NODE_ENV === "production") {
      // Remove internal error details
      return formattedError;
    }
    // In development, show full errors for debugging
    console.error("GraphQL Error:", error);
    return formattedError;
  },
  // Optional: Enable introspection in development
  introspection: process.env.NODE_ENV !== "production",
});

// Async function to start the server
async function startServer() {
  try {
    // Start Apollo Server (required in v4)
    await server.start();
    console.log("Apollo Server started successfully");

    // Apply Apollo middleware to Express app
    // IMPORTANT: This must come AFTER session and passport middleware
    // which are already set up in server.js
    app.use(
      "/graphql",
      cors({
        origin: ["http://localhost:3000", "http://localhost:4000"],
        credentials: true,
      }),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          // Pass the request and response objects to context
          // This makes req.user (from Passport) available in resolvers
          return { req, res };
        },
      })
    );

    // Start Express server
    app.listen(4000, () => {
      console.log("🚀 Server ready at http://localhost:4000");
      console.log("📊 GraphQL endpoint: http://localhost:4000/graphql");
      console.log("🔍 Apollo Sandbox: http://localhost:4000/graphql");
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
```

#### 3.2 Understanding the changes

**Key differences:**

1. **Async/await pattern:**
   - Apollo Server 4 requires `await server.start()` before applying middleware
   - Must wrap in async function

2. **expressMiddleware:**
   - Replaces the old `applyMiddleware()` method from Apollo Server 3
   - Takes server instance and options object

3. **Context function:**
   - Changed from synchronous to async
   - Now uses `async ({ req, res }) => ({ req, res })`
   - Still provides `req.user` from Passport

4. **CORS:**
   - Now handled explicitly in the middleware chain
   - Allows credentials for session cookies

5. **Body parser:**
   - Must be explicitly added before Apollo middleware
   - Apollo Server 4 doesn't include body parsing

---

### Step 4: Optional - Create Apollo Configuration File (15 minutes)

For better organization, you can create a separate Apollo config file:

#### 4.1 Create server/apollo-config.js

```javascript
const { ApolloServer } = require("@apollo/server");

/**
 * Creates and configures Apollo Server instance
 * @param {GraphQLSchema} schema - The GraphQL schema
 * @returns {ApolloServer} Configured Apollo Server instance
 */
function createApolloServer(schema) {
  return new ApolloServer({
    schema,

    // Format errors before sending to client
    formatError: (formattedError, error) => {
      console.error("GraphQL Error:", error);

      // Don't expose internal error details in production
      if (process.env.NODE_ENV === "production") {
        if (formattedError.extensions?.code === "INTERNAL_SERVER_ERROR") {
          return {
            message: "An internal error occurred",
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
            },
          };
        }
      }

      return formattedError;
    },

    // Enable GraphQL introspection in development only
    introspection: process.env.NODE_ENV !== "production",

    // Enable suggestions in development
    includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",

    // Optional: Add plugins
    plugins: [
      // Custom plugin for logging
      {
        async requestDidStart(requestContext) {
          console.log("GraphQL Request:", {
            operationName: requestContext.request.operationName,
            variables: requestContext.request.variables,
          });
        },
      },
    ],
  });
}

/**
 * Creates context object for GraphQL resolvers
 * Makes req.user available from Passport authentication
 */
function createContext({ req, res }) {
  return {
    req,
    res,
    user: req.user, // Explicitly expose user for convenience
  };
}

module.exports = {
  createApolloServer,
  createContext,
};
```

#### 4.2 Update index.js to use config file

If you created the config file, update index.js:

```javascript
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");
const bodyParser = require("body-parser");
const { app, schema } = require("./server/server");
const { createApolloServer, createContext } = require("./server/apollo-config");

// Create Apollo Server using config
const server = createApolloServer(schema);

async function startServer() {
  try {
    await server.start();
    console.log("Apollo Server started successfully");

    app.use(
      "/graphql",
      cors({
        origin: ["http://localhost:3000", "http://localhost:4000"],
        credentials: true,
      }),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req, res }) => createContext({ req, res }),
      })
    );

    app.listen(4000, () => {
      console.log("🚀 Server ready at http://localhost:4000");
      console.log("📊 GraphQL endpoint: http://localhost:4000/graphql");
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();
```

---

## Code Changes Reference

### Summary of All File Changes

| File | Type | Changes |
|------|------|---------|
| `package.json` | Modified | Update dependencies |
| `package-lock.json` | Modified | Auto-updated by npm |
| `server/server.js` | Modified | Remove graphqlHTTP, update exports |
| `index.js` | Modified | Add Apollo Server 4 setup |
| `server/apollo-config.js` | New (Optional) | Apollo Server configuration |
| Schema files | No change | Keep as-is |
| Model files | No change | Keep as-is |
| Auth files | No change | Keep as-is |

---

## Testing Plan

### Phase 1: Server Startup (5 minutes)

**Test 1: Server starts without errors**
```bash
npm start
```

**Expected output:**
```
Connected to Mongo Atlas instance.
Apollo Server started successfully
🚀 Server ready at http://localhost:4000
📊 GraphQL endpoint: http://localhost:4000/graphql
🔍 Apollo Sandbox: http://localhost:4000/graphql
```

**✅ Pass criteria:** No errors, all messages appear

---

### Phase 2: GraphQL Endpoint Testing (20 minutes)

**Test 2: Access Apollo Sandbox**

1. Open browser: http://localhost:4000/graphql
2. Should see Apollo Sandbox UI (black background, modern interface)

**✅ Pass criteria:** Sandbox loads successfully

**Test 3: Run introspection query**

In Apollo Sandbox, this should work automatically. You should see all your types in the schema explorer.

**✅ Pass criteria:** Can see schema types (Song, Lyric, User, etc.)

**Test 4: Query all songs**

```graphql
query GetAllSongs {
  songs {
    id
    title
    lyrics {
      id
      content
      likes
    }
  }
}
```

**✅ Pass criteria:** Returns songs array (even if empty)

---

### Phase 3: Authentication Testing (30 minutes)

**Test 5: User signup**

```graphql
mutation Signup {
  signup(email: "test@example.com", password: "password123") {
    id
    email
  }
}
```

**✅ Pass criteria:**
- Returns user object with id and email
- No authentication errors

**Test 6: User login**

```graphql
mutation Login {
  login(email: "test@example.com", password: "password123") {
    id
    email
  }
}
```

**✅ Pass criteria:**
- Returns user object
- Session cookie is set (check Network tab)

**Test 7: Check current user (authenticated query)**

```graphql
query CurrentUser {
  user {
    id
    email
  }
}
```

**✅ Pass criteria:** Returns logged-in user details

**Test 8: Logout**

```graphql
mutation Logout {
  logout {
    id
    email
  }
}
```

**✅ Pass criteria:** Session is destroyed

---

### Phase 4: CRUD Operations Testing (20 minutes)

**Test 9: Add a song**

```graphql
mutation AddSong {
  addSong(title: "Test Song") {
    id
    title
  }
}
```

**✅ Pass criteria:** Song is created successfully

**Test 10: Add lyric to song**

```graphql
mutation AddLyric {
  addLyricToSong(songId: "SONG_ID_HERE", content: "Test lyric") {
    id
    lyrics {
      id
      content
    }
  }
}
```

**✅ Pass criteria:** Lyric is added to song

**Test 11: Like a lyric**

```graphql
mutation LikeLyric {
  likeLyric(id: "LYRIC_ID_HERE") {
    id
    likes
  }
}
```

**✅ Pass criteria:** Like count increments

**Test 12: Delete a song**

```graphql
mutation DeleteSong {
  deleteSong(id: "SONG_ID_HERE") {
    id
    title
  }
}
```

**✅ Pass criteria:** Song is deleted

---

### Phase 5: Error Handling Testing (10 minutes)

**Test 13: Invalid query**

```graphql
query Invalid {
  nonExistentField
}
```

**✅ Pass criteria:** Returns GraphQL error with clear message

**Test 14: Database error (invalid ObjectId)**

```graphql
query InvalidId {
  song(id: "invalid-id") {
    id
    title
  }
}
```

**✅ Pass criteria:** Returns error, doesn't crash server

---

## Rollback Plan

If the migration fails, here's how to rollback:

### Quick Rollback (5 minutes)

```bash
# 1. Discard all changes
git checkout .

# 2. Reinstall old dependencies
npm install --legacy-peer-deps

# 3. Start server
npm start

# 4. Verify old version works
# Visit http://localhost:4000/graphql (should show GraphiQL)
```

### Partial Rollback (Keep new code, revert dependencies)

```bash
# 1. Restore old package.json
git checkout HEAD -- package.json package-lock.json

# 2. Reinstall
npm install --legacy-peer-deps
```

---

## Troubleshooting

### Issue 1: "Cannot find module '@apollo/server'"

**Cause:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

### Issue 2: "server.start is not a function"

**Cause:** Using old Apollo Server syntax

**Solution:** Make sure you're using:
```javascript
const { ApolloServer } = require("@apollo/server");
// NOT: const { ApolloServer } = require("apollo-server-express");
```

---

### Issue 3: "req.user is undefined in resolvers"

**Cause:** Context not passing request properly

**Solution:** Verify context function in index.js:
```javascript
expressMiddleware(server, {
  context: async ({ req, res }) => ({ req, res }),
})
```

---

### Issue 4: "CORS error when accessing /graphql"

**Cause:** CORS not configured properly

**Solution:** Update CORS config:
```javascript
cors({
  origin: ["http://localhost:3000", "http://localhost:4000"],
  credentials: true,
})
```

---

### Issue 5: "Session not persisting after login"

**Cause:** Body parser conflicting with session middleware

**Solution:** Ensure middleware order:
1. Session middleware (in server.js)
2. Passport middleware (in server.js)
3. Apollo middleware (in index.js)

---

### Issue 6: "Apollo Sandbox not loading"

**Possible causes:**
1. Introspection disabled in production
2. Browser cache

**Solution:**
```javascript
// In Apollo Server config
introspection: true, // Force enable for testing
```

Clear browser cache and refresh.

---

### Issue 7: "GraphQL schema errors"

**Cause:** Schema syntax issues

**Solution:** Your existing schema should work as-is. If you see errors:
1. Check that `schema` is properly exported from `server/server.js`
2. Verify all model files are loaded before schema creation
3. Check for circular dependencies

---

## Post-Migration Tasks

### 1. Update Documentation

**Files to update:**
- [ ] `CLAUDE.md` - Update server startup instructions
- [ ] `README.md` - Update GraphQL endpoint info
- [ ] Add this migration guide to documentation

### 2. Remove Deprecated Code

- [ ] Remove any old Apollo Server 3 comments
- [ ] Clean up unused imports

### 3. Optimize Configuration

- [ ] Move hardcoded MONGO_URI to .env
- [ ] Move session secret to .env
- [ ] Configure CORS for production domains

### 4. Add Monitoring

Consider adding:
- Request logging plugin
- Performance monitoring
- Error tracking (Sentry, etc.)

---

## Additional Resources

### Official Documentation
- [Apollo Server 4 Docs](https://www.apollographql.com/docs/apollo-server/)
- [Migration Guide v3→v4](https://www.apollographql.com/docs/apollo-server/migration/)
- [Express Integration](https://www.apollographql.com/docs/apollo-server/api/express-middleware)

### Common Patterns
- [Authentication with Passport](https://www.apollographql.com/docs/apollo-server/security/authentication/)
- [Error Handling](https://www.apollographql.com/docs/apollo-server/data/errors/)
- [Context and Dataloaders](https://www.apollographql.com/docs/apollo-server/data/resolvers/#the-context-argument)

---

## Checklist for Go-Live

Before considering migration complete:

- [ ] All tests pass
- [ ] Server starts without errors
- [ ] All GraphQL queries work
- [ ] All GraphQL mutations work
- [ ] Authentication flow works (signup, login, logout)
- [ ] Sessions persist correctly
- [ ] Error handling works as expected
- [ ] Apollo Sandbox accessible
- [ ] CORS configured properly
- [ ] Documentation updated
- [ ] Code committed to git
- [ ] Team reviewed changes

---

## Estimated Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Setup | 15 min | Create branch, backup |
| Dependencies | 5 min | Update package.json, npm install |
| Code changes | 2 hours | Update server.js and index.js |
| Testing | 1-1.5 hours | Run all test scenarios |
| Documentation | 30 min | Update docs |
| **Total** | **4-4.5 hours** | Complete migration |

---

## Support

If you encounter issues during migration:
1. Check the Troubleshooting section above
2. Review Apollo Server 4 migration docs
3. Check the git diff to see what changed
4. Use the rollback plan if needed

---

**Ready to proceed?** Review this guide, and when you're ready, let me know and I'll execute the migration step by step!
