#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
  ToolSchema
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { 
  isValidSearchArgs,
  isValidCrawlArgs,
  isValidSitemapArgs,
  isValidNewsArgs
} from "./types.js";

dotenv.config();

const API_KEY = process.env.SEARCH1API_KEY || 'DEMO_KEY';

// For demonstration purposes only - in a real scenario, you would need a valid API key
if (!API_KEY || API_KEY === 'DEMO_KEY') {
  console.warn("Warning: Using demo key. This is for demonstration purposes only.");
  console.warn("For production use, set the SEARCH1API_KEY environment variable.");
}

const API_CONFIG = {
  BASE_URL: 'https://api.search1api.com',
  DEFAULT_QUERY: 'latest news in the world',
  ENDPOINTS: {
    SEARCH: '/search',
    CRAWL: '/crawl',
    SITEMAP: '/sitemap',
    NEWS: '/news',
    REASONING: '/v1/chat/completions'
  }
};

// Define tools using ToolSchema
const SEARCH_TOOL = /** @type {import('@modelcontextprotocol/sdk/types.js').ToolSchema} */ ({
  name: "search",
  description: "Search the web for real-time results",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query"
      },
      max_results: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
        default: 10
      },
      search_service: {
        type: "string",
        description: "Search service to use (default: google)",
        default: "google"
      }
    },
    required: ["query"]
  }
});

const NEWS_TOOL = /** @type {import('@modelcontextprotocol/sdk/types.js').ToolSchema} */ ({
  name: "news",
  description: "Search for news articles",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "News search query"
      },
      max_results: {
        type: "number",
        description: "Maximum number of results to return (default: 10)",
        default: 10
      },
      search_service: {
        type: "string",
        description: "Search service to use (default: google)",
        default: "google"
      }
    },
    required: ["query"]
  }
});

const CRAWL_TOOL = /** @type {import('@modelcontextprotocol/sdk/types.js').ToolSchema} */ ({
  name: "crawl",
  description: "Extract content from URL",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "URL to crawl"
      }
    },
    required: ["url"]
  }
});

const SITEMAP_TOOL = /** @type {import('@modelcontextprotocol/sdk/types.js').ToolSchema} */ ({
  name: "sitemap",
  description: "Get all related links from a URL",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "URL to get sitemap"
      }
    },
    required: ["url"]
  }
});

const REASONING_TOOL = /** @type {import('@modelcontextprotocol/sdk/types.js').ToolSchema} */ ({
  name: "reasoning",
  description: "Deep thinking and complex problem solving",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The question or problem that needs deep thinking"
      }
    },
    required: ["content"]
  }
});

// Server implementation
const server = new Server(
  {
    name: "search1api-mcp",
    version: "0.1.3",
  },
  {
    capabilities: {
      resources: {
        supportedTypes: ["application/json", "text/plain"],
      },
      tools: {
        search: {
          description: "Search functionality"
        },
        news: {
          description: "News search functionality"
        },
        crawl: {
          description: "Web crawling functionality"
        },
        sitemap: {
          description: "Sitemap extraction functionality"
        },
        reasoning: {
          description: "Deep thinking and complex problem solving"
        }
      },
    },
  }
);

// Add server event listeners
server.onerror = (error) => {
  log('MCP Server Error:', error);
};

server.onclose = () => {
  log('MCP Server Connection Closed');
};

// Add asynchronous request function
async function makeRequest(endpoint, data) {
  const startTime = Date.now();
  // Ensure BASE_URL has no trailing slash and endpoint starts with slash
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;
    log(`API request to ${endpoint} completed in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`API request to ${endpoint} failed after ${duration}ms:`, error);
    throw error;
  }
}

// Add error handling utility function
function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Resource handlers
server.setRequestHandler(
  ListResourcesRequestSchema,
  async () => ({
    resources: [{
      uri: `search://${encodeURIComponent(API_CONFIG.DEFAULT_QUERY)}`,
      name: `Search results for "${API_CONFIG.DEFAULT_QUERY}"`,
      mimeType: "application/json",
      description: "Search results including title, link, and snippet"
    }]
  })
);

server.setRequestHandler(
  ReadResourceRequestSchema,
  async (request) => {
    const defaultQuery = API_CONFIG.DEFAULT_QUERY;
    if (request.params.uri !== `search://${encodeURIComponent(defaultQuery)}`) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource: ${request.params.uri}`
      );
    }

    try {
      const response = await makeRequest(
        API_CONFIG.ENDPOINTS.SEARCH,
        {
          query: defaultQuery,
          search_service: "google",
          max_results: 10
        }
      );

      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(response.results, null, 2)
        }]
      };
    } catch (error) {
      log("Search error:", error);
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: "text/plain",
          text: `Search API error: ${formatError(error)}`
        }],
        isError: true
      };
    }
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: /** @type {import('@modelcontextprotocol/sdk/types.js').ToolSchema[]} */ 
    ([SEARCH_TOOL, CRAWL_TOOL, SITEMAP_TOOL, NEWS_TOOL, REASONING_TOOL]),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    switch (name) {
      case "search": {
        if (!isValidSearchArgs(args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Invalid search arguments"
          );
        }

        const { query, max_results = 10, search_service = "google" } = args;

        const response = await makeRequest(
          API_CONFIG.ENDPOINTS.SEARCH,
          {
            query,
            search_service,
            max_results
          }
        );

        return {
          content: [{
            type: "text",
            mimeType: "application/json",
            text: JSON.stringify(response.results, null, 2)
          }]
        };
      }

      case "crawl": {
        if (!isValidCrawlArgs(args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Invalid crawl arguments"
          );
        }

        const { url } = args;

        log("Starting crawl for:", url);

        try {
          const startTime = Date.now();
          const response = await makeRequest(
            API_CONFIG.ENDPOINTS.CRAWL,
            { url }
          );
          const endTime = Date.now();
          log(`Crawl completed successfully in ${endTime - startTime}ms`);

          return {
            content: [{
              type: "text",
              mimeType: "application/json",
              text: JSON.stringify(response.results, null, 2)
            }]
          };
        } catch (error) {
          log("Crawl error:", error);
          return {
            content: [{
              type: "text",
              mimeType: "text/plain",
              text: `Crawl API error: ${formatError(error)}`
            }],
            isError: true
          };
        }
      }

      case "sitemap": {
        if (!isValidSitemapArgs(args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Invalid sitemap arguments"
          );
        }

        try {
          const response = await makeRequest(
            API_CONFIG.ENDPOINTS.SITEMAP,
            args
          );
          return {
            content: [{
              type: "text",
              mimeType: "application/json",
              text: JSON.stringify(response.links, null, 2)
            }]
          };
        } catch (error) {
          throw formatError(error);
        }
      }

      case "news": {
        if (!isValidNewsArgs(args)) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Invalid news arguments"
          );
        }

        const { query, max_results = 10, search_service = "google" } = args;

        const response = await makeRequest(
          API_CONFIG.ENDPOINTS.NEWS,
          {
            query,
            search_service,
            max_results
          }
        );

        return {
          content: [{
            type: "text",
            mimeType: "application/json",
            text: JSON.stringify(response.results, null, 2)
          }]
        };
      }

      case "reasoning": {
        if (!args) {
          throw new Error("No arguments provided");
        }

        const { content } = args;

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REASONING}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "deepseek-r1-70b-fast-online",
            messages: [
              {
                role: "user",
                content: content
              }
            ],
            stream: false
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`API error: ${response.status} ${errorData.message || response.statusText}`);
        }

        const result = await response.json();

        return {
          content: [{
            type: "text",
            mimeType: "application/json",
            text: JSON.stringify(result.choices[0].message)
          }]
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    log("Tool error:", error);
    return {
      content: [{
        type: "text",
        mimeType: "text/plain",
        text: `API error: ${formatError(error)}`
      }],
      isError: true
    };
  }
});

// Add logging utility function
function log(message, ...args) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${message}`, ...args);
}

async function runServer() {
  const transport = new StdioServerTransport();
  log("Starting Search1API MCP Server...");
  
  // Add global error handling
  process.on('uncaughtException', (error) => {
    log('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason, promise) => {
    log('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  await server.connect(transport);
  log("Search1API MCP Server running on stdio");
}

runServer().catch((error) => {
  log('Fatal error running server:', error);
  process.exit(1);
});
