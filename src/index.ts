import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request, Response } from "express";
import path from "path";
import { z } from "zod";

// Use process.cwd() instead of import.meta.url for path resolution
const PROJECT_ROOT = process.cwd();

const server = new McpServer({
  name: "Echo",
  version: "1.0.0",
  capabilities: {
    logging: {},
  },
});

// Register logging capability with the underlying server
server.server.registerCapabilities({
  logging: {},
});

server.resource(
  "echo",
  new ResourceTemplate("echo://{message}", { list: undefined }),
  async (uri, { message }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Resource echo: ${message}`,
      },
    ],
  })
);

server.tool("echo", { message: z.string() }, async ({ message }) => {
  // Only log when the tool is actually used
  await server.server.sendLoggingMessage({
    level: "info",
    data: `Echo tool used with message: ${message}`,
  });
  return {
    content: [{ type: "text", text: `Tool echo: ${message}` }],
  };
});

server.prompt("echo", { message: z.string() }, ({ message }) => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Please process this message: ${message}`,
      },
    },
  ],
}));

// STDIO
// async function main() {
//   const transport = new StdioServerTransport();
//   await server.connect(transport);
// }

// main();

// SSE
const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(PROJECT_ROOT, "public")));

// to support multiple simultaneous connections we have a lookup object from
// sessionId to transport
const transports: { [sessionId: string]: SSEServerTransport } = {};

app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.get("/test", async (_: Request, res: Response) => {
  res.send("Test route works!");
});

app.get("/", async (_: Request, res: Response) => {
  res.sendFile(path.join(PROJECT_ROOT, "dist", "index.html"));
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

app.listen(3001, "0.0.0.0");
