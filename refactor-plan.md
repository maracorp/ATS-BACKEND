# Refactoring Plan for ATS-Backend

## Executive Summary
This document outlines a comprehensive refactoring plan to improve security, maintainability, error handling, and code organization for the GraphQL backend application.

---

## Phase 1: Security & Configuration (HIGH PRIORITY)

### 1.1 Environment Variables
**Issue**: Database credentials and session secrets are hardcoded in `server/server.js:16-17, 39, 42-43`

**Action Items**:
- Create `.env` file with:
  - `MONGODB_URI`
  - `SESSION_SECRET`
  - `NODE_ENV`
  - `PORT`
- Update `server/server.js` to use `process.env` variables
- Add `.env.example` template for developers
- Update README.md with environment setup instructions
- Ensure `.env` is in `.gitignore`

### 1.2 Remove Exposed Credentials
**Issue**: MongoDB credentials are committed to the repository

**Action Items**:
- Immediately rotate exposed MongoDB credentials
- Remove hardcoded credentials from all files
- Audit git history for exposed secrets (consider using tools like `git-secrets`)

### 1.3 Input Validation & Sanitization
**Issue**: No validation on GraphQL inputs (mutations.js)

**Action Items**:
- Add email validation using a library like `validator`
- Implement password strength requirements
- Sanitize user inputs to prevent injection attacks
- Add GraphQL input validation using `graphql-validation-complexity` or similar
- Validate ObjectIds before querying

---

## Phase 2: Dependency & Package Management

### 2.1 Fix Missing Dependencies
**Issue**: `bcrypt-nodejs` is used in `User.js:1` but not in `package.json`
**Issue**: `webpack` and `webpack-dev-middleware` referenced but not in dependencies
**Issue**: `connect-mongo` used but not in dependencies

**Action Items**:
- Add missing dependencies to `package.json`
- Replace deprecated `bcrypt-nodejs` with `bcrypt` (actively maintained)
- Update `User.js` to use modern `bcrypt` API
- Decide if webpack middleware is needed; if not, remove from `server.js:64-67`

### 2.2 Update Deprecated Dependencies
**Issue**: Using `apollo-server-express@3.x` (EOL), `express-graphql` pattern is mixed

**Action Items**:
- Migrate to Apollo Server 4 with proper Express integration
- Remove unused `express-graphql` imports and code
- Update to latest stable versions of core dependencies
- Remove `--legacy-peer-deps` requirement if possible

### 2.3 Deprecated Mongoose Methods
**Issue**: `findByIdAndRemove` used in `mutations.js:83` (deprecated)

**Action Items**:
- Replace `findByIdAndRemove` with `findByIdAndDelete`
- Review other Mongoose deprecation warnings

---

## Phase 3: Error Handling & Logging

### 3.1 Centralized Error Handling
**Issue**: Inconsistent error handling across resolvers and services

**Action Items**:
- Create custom error classes (AuthenticationError, ValidationError, etc.)
- Implement GraphQL error formatting middleware
- Add proper error responses with meaningful messages
- Ensure errors don't leak sensitive information

### 3.2 Add Logging
**Issue**: Only console.log statements, no structured logging

**Action Items**:
- Integrate logging library (Winston or Pino)
- Add structured logging for:
  - Authentication events
  - Database operations
  - API requests
  - Errors and exceptions
- Configure log levels based on environment

### 3.3 Handle Edge Cases
**Issue**: Missing null checks and error handling in resolvers

**Action Items**:
- Add null checks in `auth.js:97-104` (passport.authenticate callback)
- Handle logout errors properly in `mutations.js:45-50`
- Add try-catch blocks around async operations
- Handle mongoose connection errors gracefully

---

## Phase 4: Authentication & Authorization

### 4.1 Modernize Authentication Flow
**Issue**: Mixed callback/promise patterns in `auth.js`

**Action Items**:
- Convert Passport callbacks to async/await using `util.promisify`
- Standardize error handling in signup/login
- Add request validation before authentication
- Implement rate limiting for auth endpoints

### 4.2 Add Authorization Layer
**Issue**: No authorization checks on mutations (anyone can delete songs, add lyrics)

**Action Items**:
- Create authorization middleware/helpers
- Add user ownership checks for song operations
- Protect mutations that modify data (require authentication)
- Add role-based access control if needed

### 4.3 Session Security
**Issue**: Session configuration may not be production-ready

**Action Items**:
- Review session configuration in `server.js:36-46`:
  - Set `resave: false` and `saveUninitialized: false`
  - Add `cookie.secure: true` for HTTPS
  - Configure `cookie.httpOnly: true`
  - Set appropriate `cookie.maxAge`
- Add CSRF protection

---

## Phase 5: Code Organization & Structure

### 5.1 Reorganize Project Structure
**Current issues**: Flat structure, mixed concerns

**Proposed structure**:
```
server/
├── config/          # Configuration files
│   ├── database.js
│   ├── passport.js
│   └── session.js
├── models/          # Mongoose models (existing)
├── schema/          # GraphQL schema (existing)
│   ├── types/      # Type definitions
│   ├── resolvers/  # Resolver functions
│   └── index.js
├── services/        # Business logic
│   ├── auth.js
│   ├── song.js
│   └── lyric.js
├── middleware/      # Express/GraphQL middleware
├── utils/           # Utility functions
│   ├── validation.js
│   └── errors.js
└── server.js
```

### 5.2 Separate Concerns
**Action Items**:
- Extract database connection logic to `config/database.js`
- Move Passport configuration to `config/passport.js`
- Extract session setup to `config/session.js`
- Create separate resolver files instead of monolithic mutations.js
- Move business logic from resolvers to service layer

### 5.3 Clean Up Code
**Issue**: Commented out code in `server.js:3, 11, 54` and `mutations.js:43-44`

**Action Items**:
- Remove commented out code
- Remove unused imports (lodash in `schema.js:1`)
- Fix typo in `root_query_type.js:28` ("parnetValue")

---

## Phase 6: Data Model Improvements

### 6.1 Add Model Validation
**Issue**: Minimal validation in Mongoose schemas

**Action Items**:
- Add required fields, unique constraints
- Add indexes for frequently queried fields
- Add data validation rules (email format, string lengths)
- Add timestamps (`createdAt`, `updatedAt`)

### 6.2 Improve Relationships
**Issue**: Songs reference users but it's not utilized

**Action Items**:
- Decide if song.user relationship should be enforced
- Add proper population strategies
- Consider virtual fields for reverse relationships

### 6.3 Add Data Migration Strategy
**Action Items**:
- Set up migration framework (migrate-mongo)
- Create initial migration for existing data
- Document migration procedures

---

## Phase 7: Testing Infrastructure

### 7.1 Set Up Testing Framework
**Issue**: No tests exist

**Action Items**:
- Add Jest and testing dependencies
- Configure test environment
- Set up test database (MongoDB Memory Server)
- Add npm test script

### 7.2 Write Tests
**Action Items**:
- Unit tests for:
  - Model methods (User.comparePassword, Song.addLyric, Lyric.like)
  - Service functions (auth.signup, auth.login)
  - Validation utilities
- Integration tests for:
  - GraphQL queries and mutations
  - Authentication flows
  - Database operations
- Aim for >80% code coverage

---

## Phase 8: API Improvements

### 8.1 GraphQL Best Practices
**Action Items**:
- Add pagination for list queries (songs)
- Implement DataLoader to prevent N+1 queries
- Add query complexity limits
- Add depth limiting
- Implement proper GraphQL error handling

### 8.2 Add API Documentation
**Action Items**:
- Document GraphQL schema with descriptions
- Add example queries and mutations
- Create Postman/Insomnia collection
- Document authentication flow

---

## Phase 9: Developer Experience

### 9.1 Add Code Quality Tools
**Action Items**:
- Add ESLint with appropriate config
- Add Prettier for code formatting
- Add husky for pre-commit hooks
- Add lint-staged for staged file linting
- Add npm scripts for linting

### 9.2 Add TypeScript (Optional)
**Benefits**: Type safety, better IDE support, fewer runtime errors

**Action Items**:
- Add TypeScript dependencies
- Configure tsconfig.json
- Gradually migrate files to .ts
- Add types for models, resolvers, context
- Use graphql-codegen for type generation

### 9.3 Improve Development Workflow
**Action Items**:
- Add debugging configuration (.vscode/launch.json)
- Add docker-compose for local MongoDB
- Create seed data script for development
- Add healthcheck endpoint

---

## Phase 10: Production Readiness

### 10.1 Add Monitoring & Observability
**Action Items**:
- Add health check endpoint
- Implement metrics collection (prom-client)
- Add APM integration (e.g., New Relic, Datadog)
- Set up error tracking (Sentry)

### 10.2 Performance Optimization
**Action Items**:
- Add Redis for session store (production)
- Implement caching strategy
- Add database indexes
- Optimize GraphQL resolver efficiency
- Add compression middleware

### 10.3 Deployment Configuration
**Action Items**:
- Create Dockerfile
- Add docker-compose for full stack
- Configure for cloud deployment (AWS/GCP/Azure)
- Set up CI/CD pipeline
- Add deployment documentation

---

## Implementation Priority

### Critical (Do First)
1. Phase 1: Security & Configuration
2. Phase 2.1: Fix missing dependencies
3. Phase 3.1: Centralized error handling
4. Phase 4.2: Add authorization checks

### High Priority
1. Phase 2.2: Update deprecated dependencies
2. Phase 4.1: Modernize authentication flow
3. Phase 5.3: Clean up code
4. Phase 6.1: Add model validation

### Medium Priority
1. Phase 5.1-5.2: Code organization
2. Phase 7: Testing infrastructure
3. Phase 8: API improvements
4. Phase 9.1: Code quality tools

### Low Priority (Nice to Have)
1. Phase 9.2: TypeScript migration
2. Phase 10: Production readiness enhancements

---

## Success Metrics
- Zero hardcoded credentials
- 80%+ test coverage
- All linting rules passing
- Zero critical security vulnerabilities
- Response time <200ms for 95% of requests
- Clear separation of concerns
- Comprehensive documentation

---

## Notes
- Implement changes incrementally to avoid breaking existing functionality
- Create feature branches for each phase
- Test thoroughly after each phase
- Consider backward compatibility if there are existing clients
- Update CLAUDE.md after major structural changes
