# Apollo Server 4 Migration - Quick Reference

## TL;DR - What Changes

### Dependencies
```bash
# Remove
❌ apollo-server-express
❌ express-graphql

# Add
✅ @apollo/server
```

### File Changes Summary
| File | What Changes |
|------|--------------|
| `package.json` | Update dependencies |
| `server/server.js` | Export `{ app, schema }` instead of just `app` |
| `index.js` | Add Apollo Server setup (complete rewrite) |

---

## Code Snippets - Copy & Paste Ready

### 1. package.json Dependencies Section

Replace entire dependencies section with:

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

---

### 2. server/server.js Changes

**TOP OF FILE - Update imports:**

Remove this line:
```javascript
const { graphqlHTTP } = require("express-graphql");
```

Add this line:
```javascript
const cors = require("cors");
```

**BOTTOM OF FILE - Update exports:**

Remove this:
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

Replace with:
```javascript
module.exports = { app, schema };
```

---

### 3. index.js - Complete Replacement

Replace ENTIRE file with:

```javascript
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");
const bodyParser = require("body-parser");
const { app, schema } = require("./server/server");

const server = new ApolloServer({
  schema,
  introspection: true,
  formatError: (formattedError, error) => {
    console.error("GraphQL Error:", error);
    return formattedError;
  },
});

async function startServer() {
  try {
    await server.start();
    console.log("✅ Apollo Server started");

    app.use(
      "/graphql",
      cors({
        origin: ["http://localhost:3000", "http://localhost:4000"],
        credentials: true,
      }),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req, res }) => ({ req, res }),
      })
    );

    app.listen(4000, () => {
      console.log("🚀 Server ready at http://localhost:4000/graphql");
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

startServer();
```

---

## Installation Commands

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start server
npm start

# Expected output:
# Connected to Mongo Atlas instance.
# ✅ Apollo Server started
# 🚀 Server ready at http://localhost:4000/graphql
```

---

## Testing Checklist

After migration, test these in Apollo Sandbox (http://localhost:4000/graphql):

### ✅ Basic Query
```graphql
query {
  songs {
    id
    title
  }
}
```

### ✅ Signup
```graphql
mutation {
  signup(email: "test@test.com", password: "pass123") {
    id
    email
  }
}
```

### ✅ Login
```graphql
mutation {
  login(email: "test@test.com", password: "pass123") {
    id
    email
  }
}
```

### ✅ Current User
```graphql
query {
  user {
    id
    email
  }
}
```

---

## Rollback (If Something Breaks)

```bash
git checkout .
npm install --legacy-peer-deps
npm start
```

---

## Key Differences to Remember

| Apollo Server 3 (Old) | Apollo Server 4 (New) |
|-----------------------|----------------------|
| `apollo-server-express` | `@apollo/server` |
| `applyMiddleware()` | `expressMiddleware()` |
| Synchronous startup | Async `await server.start()` |
| GraphiQL | Apollo Sandbox |
| Auto body parsing | Manual `bodyParser.json()` |
| Auto CORS | Manual `cors()` |
| Context: `({ req }) => ({ req })` | Context: `async ({ req, res }) => ({ req, res })` |

---

## Common Errors & Fixes

### Error: "Cannot find module '@apollo/server'"
```bash
npm install --legacy-peer-deps
```

### Error: "req.user is undefined"
Check context function passes `req` correctly:
```javascript
context: async ({ req, res }) => ({ req, res })
```

### Error: "CORS blocked"
Add origin to CORS config:
```javascript
cors({ origin: "http://localhost:3000", credentials: true })
```

### Error: "Body parser conflict"
Ensure middleware order:
1. Session (in server.js) ✅
2. Passport (in server.js) ✅
3. Apollo (in index.js) ✅

---

## What Doesn't Change

✅ All GraphQL schema files (types, mutations, queries)
✅ All Mongoose models
✅ Authentication logic
✅ Session configuration
✅ Passport configuration
✅ Business logic in resolvers

Only the **server setup** changes!

---

## Timeline

- ⏱️ Code changes: 30 minutes
- ⏱️ Testing: 30 minutes
- ⏱️ **Total: 1 hour**

---

**Ready?** Say the word and I'll execute this migration for you!
