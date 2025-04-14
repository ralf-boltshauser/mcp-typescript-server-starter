# MCP TypeScript Server Starter

A starter project for building Model Context Protocol (MCP) servers in TypeScript. This project provides a simple echo server implementation that demonstrates the core features of MCP.

## Features

- Simple echo server implementation
- Support for tools, resources, and prompts
- TypeScript support
- Development server with hot reloading
- Built-in inspector for testing and debugging
- Support for both STDIO and SSE communication modes

## Prerequisites

- Node.js (v16 or later)
- pnpm (recommended) or npm

## Installation

```bash
# Clone the repository
git clone https://github.com/ralf-boltshauser/mcp-typescript-server-starter.git
cd mcp-typescript-server-starter

# Install dependencies
pnpm install
```

## Usage Modes

This server supports two main communication modes:

1. **STDIO Mode**
   - Ideal for local development and basic testing
   - Direct process communication
   - Used by most MCP clients by default
   - Perfect for running servers locally
   - Simple to set up and use

2. **SSE Mode**
   - Better for production deployments
   - HTTP/SSE communication
   - Can be converted to STDIO using npm packages (covered later)
   - Enables remote access to your server
   - More scalable and production-ready

Choose STDIO for local development and SSE when you need to deploy your server for remote access.

### STDIO Mode (Direct Process Communication)

This mode is ideal for direct integration with tools like Cursor or Claude Desktop.

1. **Configure the Server**
   - In `src/index.ts`:
     - Comment out the Express/SSE code at (the bottom)
     - Uncomment the STDIO code (above it)

2. **Build and Run**
   ```bash
   pnpm build
   node dist/index.cjs
   ```
  or 
  ```bash
  pnpm dev # starts the server and the inspector
  ```

3. **Integration with Claude Desktop**
   ```bash
   pnpm add-claude
   ```
   ⚠️ **Note**: This will overwrite your existing Claude Desktop configuration.

   This way of configuring claude desktop is standard. The json that is generated can also be used in cursor and so on!

4. **Manual Integration**
   For other tools, use the command:
   ```bash
   node /path/to/your/project/dist/index.cjs
   ```

   or 
   ```bash
   pnpm cmd # this gives you the node .../dist/index.cjs command directly with pwd
   ```

### SSE Mode (HTTP/SSE Communication)

This mode is ideal for web-based tools and remote deployments.

1. **Configure the Server**
   - In `src/index.ts`:
     - Keep the Express/SSE code enabled (at the bottom)
     - Comment out the STDIO code (above it)

2. **Local Development**
   ```bash
   pnpm dev
   ```
   The server will be available at:
   - Main endpoint: http://127.0.0.1:3001
   - SSE endpoint: http://127.0.0.1:3001/sse
   - Test endpoint: http://127.0.0.1:3001/test
   - Inspector: http://127.0.0.1:6274

3. **Local Docker Testing**
  The docker compose override is needed to actually expose the ports. When deploying to stuff like coolify you don't want it because traefik will handle it.
   ```bash
   docker compose -f docker-compose.yaml -f docker-compose.local.yaml up
   ```

4. **Production Deployment (e.g., Coolify)**
   - Deploy the server to your preferred platform
   - **Important**: In Coolify's advanced settings:
     - Disable GZIP compression (this kills the SSE stream)
     - Ensure port 3001 is properly exposed -> when setting a domain do it like this: https://your-domain.com:3001 this tells traefik to bind to port 3001.
     - Configure the server to listen on all interfaces (0.0.0.0) (already done)

5. **Using the Remote Server**
   Once deployed, you can connect to the server using:
   ```bash
   npx -y mcp-remote https://your-domain.com/sse
   ```
   You can paste this as command and replace the "node .../dist/index.cjs" with this.

## Project Structure

- `src/index.ts` - Main server implementation
- `src/low-level-index.ts` - Alternative implementation using the low-level API
- `dist/` - Compiled output directory

## Server Features

### Echo Tool
A simple tool that echoes back the input message:
```typescript
server.tool("echo", { message: z.string() }, async ({ message }) => ({
  content: [{ type: "text", text: `Tool echo: ${message}` }],
}));
```

### Echo Resource
A resource that can be accessed via URI:
```typescript
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
```

### Echo Prompt
A prompt template for processing messages:
```typescript
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
```

## Implementation Recommendations

### Debug Messages

Debug messages can be sent using the `server.server.sendLoggingMessage` method to provide visibility into server operations.

#### Basic Usage
```typescript
server.server.sendLoggingMessage({
  level: "info",
  data: "Starting server...",
});
```

This allows you to:
- Track server operations in real-time
- Debug issues during development
- Monitor server state in production

You can see them in the inspector on the bottom right!

### Environment Variables

For server-side environment variables (developer-provided, not user-specific):

1. **Using Docker Compose**
   ```yaml
   # docker-compose.yaml
   services:
     mmcp-server:
       environment:
         - API_KEY=${API_KEY}
         - DATABASE_URL=${DATABASE_URL}
   ```
   This allows you to:
   - Set variables in your shell: `export API_KEY=your-key`
   - Use a `.env` file that Docker Compose will automatically load

2. **Accessing in Code**
   ```typescript
   const apiKey = process.env.API_KEY;
   const dbUrl = process.env.DATABASE_URL;
   ```

3. **Local Development**
   - Create a `.env` file in your project root:
     ```
     API_KEY=sk-123
     ```
   - Add `.env` to `.gitignore` to keep secrets secure
   - Run the development server with environment variables:
     ```sh
     pnpm dev
     ```

4. **Production Deployment**
   - Set environment variables in your deployment platform (e.g., Coolify)
   - Never commit sensitive values to version control

### Best Practices

1. **Error Handling**
   - Always implement proper error handling for environment variables
   - Provide meaningful error messages for missing required variables

2. **Type Safety**
   - Use TypeScript to define environment variable types
   - Consider using a validation library like `zod` for runtime checks

3. **Security**
   - Never expose sensitive environment variables to the client
   - Use different sets of variables for development and production

## License

[MIT](LICENSE) 