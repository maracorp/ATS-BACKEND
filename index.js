const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");
const bodyParser = require("body-parser");
const { app, schema } = require("./server/server");

const server = new ApolloServer({
  schema,
  introspection: true,
  includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
});

async function startServer() {
  await server.start();
  console.log("✅ Apollo Server started");

  const corsOptions = {
    origin: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
      .split(",")
      .map(o => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  // ✅ Apply CORS ONLY to /graphql
  app.use(
    "/graphql",
    cors(corsOptions),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => ({ req, res }),
    })
  );

  //added for AWS ALB health check
  app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "mara-backend"
  });
});

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready on port ${PORT}`);
  });
}

startServer();
