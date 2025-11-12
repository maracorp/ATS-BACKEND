const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");
const bodyParser = require("body-parser");
const { app, schema } = require("./server/server");

// Create Apollo Server instance
const server = new ApolloServer({
  schema,
  // Format errors before sending to client
  formatError: (formattedError, error) => {
    console.error("GraphQL Error:", error);
    return formattedError;
  },
  // Enable introspection (can be disabled in production)
  introspection: true,
  // Include stack traces in development
  includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
});

// Async function to start the server
async function startServer() {
  try {
    // Start Apollo Server (required in Apollo Server 4)
    await server.start();
    console.log("✅ Apollo Server started successfully");

    // Apply Apollo middleware to Express app
    // IMPORTANT: This runs AFTER session and passport middleware
    // which are already configured in server/server.js
    app.use(
      "/graphql",
      cors({
        origin: ["http://localhost:3000", "http://localhost:4000"],
        credentials: true, // Allow cookies for sessions
      }),
      bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          // Pass request and response to GraphQL context
          // This makes req.user (from Passport) available in resolvers
          return { req, res };
        },
      })
    );

    // Start Express server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`🔍 Apollo Sandbox: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

// Start the server
startServer();
