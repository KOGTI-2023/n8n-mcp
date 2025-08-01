#!/usr/bin/env node
/**
 * Single-Session HTTP server for n8n-MCP
 * Implements Hybrid Single-Session Architecture for protocol compliance
 * while maintaining simplicity for single-player use case
 */
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { N8NDocumentationMCPServer } from './mcp/server';
import { ConsoleManager } from './utils/console-manager';
import { logger } from './utils/logger';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { getStartupBaseUrl, formatEndpointUrls, detectBaseUrl } from './utils/url-detector';
import { PROJECT_VERSION } from './utils/version';

dotenv.config();

interface Session {
  server: N8NDocumentationMCPServer;
  transport: StreamableHTTPServerTransport;
  lastAccess: Date;
  sessionId: string;
}

export class SingleSessionHTTPServer {
  private session: Session | null = null;
  private consoleManager = new ConsoleManager();
  private expressServer: any;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private authToken: string | null = null;
  
  constructor() {
    // Validate environment on construction
    this.validateEnvironment();
  }
  
  /**
   * Load auth token from environment variable or file
   */
  private loadAuthToken(): string | null {
    // First, try AUTH_TOKEN environment variable
    if (process.env.AUTH_TOKEN) {
      logger.info('Using AUTH_TOKEN from environment variable');
      return process.env.AUTH_TOKEN;
    }
    
    // Then, try AUTH_TOKEN_FILE
    if (process.env.AUTH_TOKEN_FILE) {
      try {
        const token = readFileSync(process.env.AUTH_TOKEN_FILE, 'utf-8').trim();
        logger.info(`Loaded AUTH_TOKEN from file: ${process.env.AUTH_TOKEN_FILE}`);
        return token;
      } catch (error) {
        logger.error(`Failed to read AUTH_TOKEN_FILE: ${process.env.AUTH_TOKEN_FILE}`, error);
        console.error(`ERROR: Failed to read AUTH_TOKEN_FILE: ${process.env.AUTH_TOKEN_FILE}`);
        console.error(error instanceof Error ? error.message : 'Unknown error');
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Validate required environment variables
   */
  private validateEnvironment(): void {
    // Load auth token from env var or file
    this.authToken = this.loadAuthToken();
    
    if (!this.authToken || this.authToken.trim() === '') {
      const message = 'No authentication token found or token is empty. Set AUTH_TOKEN environment variable or AUTH_TOKEN_FILE pointing to a file containing the token.';
      logger.error(message);
      throw new Error(message);
    }
    
    // Update authToken to trimmed version
    this.authToken = this.authToken.trim();
    
    if (this.authToken.length < 32) {
      logger.warn('AUTH_TOKEN should be at least 32 characters for security');
    }
    
    // Check for default token and show prominent warnings
    if (this.authToken === 'REPLACE_THIS_AUTH_TOKEN_32_CHARS_MIN_abcdefgh') {
      logger.warn('⚠️ SECURITY WARNING: Using default AUTH_TOKEN - CHANGE IMMEDIATELY!');
      logger.warn('Generate secure token with: openssl rand -base64 32');
      
      // Only show console warnings in HTTP mode
      if (process.env.MCP_MODE === 'http') {
        console.warn('\n⚠️  SECURITY WARNING ⚠️');
        console.warn('Using default AUTH_TOKEN - CHANGE IMMEDIATELY!');
        console.warn('Generate secure token: openssl rand -base64 32');
        console.warn('Update via Railway dashboard environment variables\n');
      }
    }
  }
  
  /**
   * Handle incoming MCP request
   */
  async handleRequest(req: express.Request, res: express.Response): Promise<void> {
    const startTime = Date.now();
    
    // Wrap all operations to prevent console interference
    return this.consoleManager.wrapOperation(async () => {
      try {
        // Ensure we have a valid session
        if (!this.session || this.isExpired()) {
          await this.resetSession();
        }
        
        // Update last access time
        this.session!.lastAccess = new Date();
        
        // Handle request with existing transport
        logger.debug('Calling transport.handleRequest...');
        await this.session!.transport.handleRequest(req, res);
        logger.debug('transport.handleRequest completed');
        
        // Log request duration
        const duration = Date.now() - startTime;
        logger.info('MCP request completed', { 
          duration,
          sessionId: this.session!.sessionId
        });
        
      } catch (error) {
        logger.error('MCP request error:', error);
        
        if (!res.headersSent) {
          res.status(500).json({ 
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
              data: process.env.NODE_ENV === 'development' 
                ? (error as Error).message 
                : undefined
            },
            id: null
          });
        }
      }
    });
  }
  
  /**
   * Reset the session - clean up old and create new
   */
  private async resetSession(): Promise<void> {
    // Clean up old session if exists
    if (this.session) {
      try {
        logger.info('Closing previous session', { sessionId: this.session.sessionId });
        await this.session.transport.close();
        // Note: Don't close the server as it handles its own lifecycle
      } catch (error) {
        logger.warn('Error closing previous session:', error);
      }
    }
    
    try {
      // Create new session
      logger.info('Creating new N8NDocumentationMCPServer...');
      const server = new N8NDocumentationMCPServer();
      
      logger.info('Creating StreamableHTTPServerTransport...');
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => 'single-session', // Always same ID for single-session
      });
      
      logger.info('Connecting server to transport...');
      await server.connect(transport);
      
      this.session = {
        server,
        transport,
        lastAccess: new Date(),
        sessionId: 'single-session'
      };
      
      logger.info('Created new single session successfully', { sessionId: this.session.sessionId });
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }
  
  /**
   * Check if current session is expired
   */
  private isExpired(): boolean {
    if (!this.session) return true;
    return Date.now() - this.session.lastAccess.getTime() > this.sessionTimeout;
  }
  
  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    const app = express();
    
    // Configure trust proxy for correct IP logging behind reverse proxies
    const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 0;
    if (trustProxy > 0) {
      app.set('trust proxy', trustProxy);
      logger.info(`Trust proxy enabled with ${trustProxy} hop(s)`);
    }
    
    // DON'T use any body parser globally - StreamableHTTPServerTransport needs raw stream
    // Only use JSON parser for specific endpoints that need it
    
    // Security headers
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      next();
    });
    
    // CORS configuration
    app.use((req, res, next) => {
      const allowedOrigin = process.env.CORS_ORIGIN || '*';
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
      res.setHeader('Access-Control-Max-Age', '86400');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });
    
    // Request logging middleware
    app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        contentLength: req.get('content-length')
      });
      next();
    });
    
    // Root endpoint with API information
    app.get('/', (req, res) => {
      const port = parseInt(process.env.PORT || '3000');
      const host = process.env.HOST || '0.0.0.0';
      const baseUrl = detectBaseUrl(req, host, port);
      const endpoints = formatEndpointUrls(baseUrl);
      
      res.json({
        name: 'n8n Documentation MCP Server',
        version: PROJECT_VERSION,
        description: 'Model Context Protocol server providing comprehensive n8n node documentation and workflow management',
        endpoints: {
          health: {
            url: endpoints.health,
            method: 'GET',
            description: 'Health check and status information'
          },
          mcp: {
            url: endpoints.mcp,
            method: 'GET/POST',
            description: 'MCP endpoint - GET for info, POST for JSON-RPC'
          }
        },
        authentication: {
          type: 'Bearer Token',
          header: 'Authorization: Bearer <token>',
          required_for: ['POST /mcp']
        },
        documentation: 'https://github.com/czlonkowski/n8n-mcp'
      });
    });

    // Health check endpoint (no body parsing needed for GET)
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        mode: 'single-session',
        version: PROJECT_VERSION,
        uptime: Math.floor(process.uptime()),
        sessionActive: !!this.session,
        sessionAge: this.session 
          ? Math.floor((Date.now() - this.session.lastAccess.getTime()) / 1000)
          : null,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        timestamp: new Date().toISOString()
      });
    });
    
    // MCP information endpoint (no auth required for discovery)
    app.get('/mcp', (req, res) => {
      res.json({
        description: 'n8n Documentation MCP Server',
        version: PROJECT_VERSION,
        endpoints: {
          mcp: {
            method: 'POST',
            path: '/mcp',
            description: 'Main MCP JSON-RPC endpoint',
            authentication: 'Bearer token required'
          },
          health: {
            method: 'GET',
            path: '/health',
            description: 'Health check endpoint',
            authentication: 'None'
          },
          root: {
            method: 'GET',
            path: '/',
            description: 'API information',
            authentication: 'None'
          }
        },
        documentation: 'https://github.com/czlonkowski/n8n-mcp'
      });
    });

    // Main MCP endpoint with authentication
    app.post('/mcp', async (req: express.Request, res: express.Response): Promise<void> => {
      // Enhanced authentication check with specific logging
      const authHeader = req.headers.authorization;
      
      // Check if Authorization header is missing
      if (!authHeader) {
        logger.warn('Authentication failed: Missing Authorization header', { 
          ip: req.ip,
          userAgent: req.get('user-agent'),
          reason: 'no_auth_header'
        });
        res.status(401).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized'
          },
          id: null
        });
        return;
      }
      
      // Check if Authorization header has Bearer prefix
      if (!authHeader.startsWith('Bearer ')) {
        logger.warn('Authentication failed: Invalid Authorization header format (expected Bearer token)', { 
          ip: req.ip,
          userAgent: req.get('user-agent'),
          reason: 'invalid_auth_format',
          headerPrefix: authHeader.substring(0, 10) + '...'  // Log first 10 chars for debugging
        });
        res.status(401).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized'
          },
          id: null
        });
        return;
      }
      
      // Extract token and trim whitespace
      const token = authHeader.slice(7).trim();
      
      // Check if token matches
      if (token !== this.authToken) {
        logger.warn('Authentication failed: Invalid token', { 
          ip: req.ip,
          userAgent: req.get('user-agent'),
          reason: 'invalid_token'
        });
        res.status(401).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32001,
            message: 'Unauthorized'
          },
          id: null
        });
        return;
      }
      
      // Handle request with single session
      await this.handleRequest(req, res);
    });
    
    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ 
        error: 'Not found',
        message: `Cannot ${req.method} ${req.path}`
      });
    });
    
    // Error handler
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Express error handler:', err);
      
      if (!res.headersSent) {
        res.status(500).json({ 
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
            data: process.env.NODE_ENV === 'development' ? err.message : undefined
          },
          id: null
        });
      }
    });
    
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    this.expressServer = app.listen(port, host, () => {
      logger.info(`n8n MCP Single-Session HTTP Server started`, { port, host });
      
      // Detect the base URL using our utility
      const baseUrl = getStartupBaseUrl(host, port);
      const endpoints = formatEndpointUrls(baseUrl);
      
      console.log(`n8n MCP Single-Session HTTP Server running on ${host}:${port}`);
      console.log(`Health check: ${endpoints.health}`);
      console.log(`MCP endpoint: ${endpoints.mcp}`);
      console.log('\nPress Ctrl+C to stop the server');
      
      // Start periodic warning timer if using default token
      if (this.authToken === 'REPLACE_THIS_AUTH_TOKEN_32_CHARS_MIN_abcdefgh') {
        setInterval(() => {
          logger.warn('⚠️ Still using default AUTH_TOKEN - security risk!');
          if (process.env.MCP_MODE === 'http') {
            console.warn('⚠️ REMINDER: Still using default AUTH_TOKEN - please change it!');
          }
        }, 300000); // Every 5 minutes
      }
      
      if (process.env.BASE_URL || process.env.PUBLIC_URL) {
        console.log(`\nPublic URL configured: ${baseUrl}`);
      } else if (process.env.TRUST_PROXY && Number(process.env.TRUST_PROXY) > 0) {
        console.log(`\nNote: TRUST_PROXY is enabled. URLs will be auto-detected from proxy headers.`);
      }
    });
    
    // Handle server errors
    this.expressServer.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is already in use`);
        console.error(`ERROR: Port ${port} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Single-Session HTTP server...');
    
    // Clean up session
    if (this.session) {
      try {
        await this.session.transport.close();
        logger.info('Session closed');
      } catch (error) {
        logger.warn('Error closing session:', error);
      }
      this.session = null;
    }
    
    // Close Express server
    if (this.expressServer) {
      await new Promise<void>((resolve) => {
        this.expressServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }
  }
  
  /**
   * Get current session info (for testing/debugging)
   */
  getSessionInfo(): { active: boolean; sessionId?: string; age?: number } {
    if (!this.session) {
      return { active: false };
    }
    
    return {
      active: true,
      sessionId: this.session.sessionId,
      age: Date.now() - this.session.lastAccess.getTime()
    };
  }
}

// Start if called directly
if (require.main === module) {
  const server = new SingleSessionHTTPServer();
  
  // Graceful shutdown handlers
  const shutdown = async () => {
    await server.shutdown();
    process.exit(0);
  };
  
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    console.error('Uncaught exception:', error);
    shutdown();
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', reason);
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    shutdown();
  });
  
  // Start server
  server.start().catch(error => {
    logger.error('Failed to start Single-Session HTTP server:', error);
    console.error('Failed to start Single-Session HTTP server:', error);
    process.exit(1);
  });
}