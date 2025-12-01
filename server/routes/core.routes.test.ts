import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { registerCoreRoutes } from './core.routes.js';
import type { Express } from 'express';

// Mock the logger
jest.mock('../services/logger.service.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Core Routes', () => {
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
  });

  describe('registerCoreRoutes', () => {
    it('should register core routes on the app', () => {
      registerCoreRoutes(mockApp);

      // Should register multiple GET routes
      expect(mockApp.get).toHaveBeenCalledTimes(4);

      // Check specific routes are registered
      expect(mockApp.get).toHaveBeenCalledWith('/api/test', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/api/compliance-guide', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/api/health', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/api/system/info', expect.any(Function));
    });
  });

  describe('GET /api/test', () => {
    it('should return successful test response', async () => {
      registerCoreRoutes(mockApp);

      // Get the test route handler
      const testRouteCall = mockApp.get.mock.calls.find(call => call[0] === '/api/test');
      const testHandler = testRouteCall[1];

      const mockReq = global.testUtils.createMockReq();
      const mockRes = global.testUtils.createMockRes();
      const mockNext = global.testUtils.createMockNext();

      await testHandler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'API is working',
        environment: 'test',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /api/health', () => {
    it('should return health status with system metrics', async () => {
      registerCoreRoutes(mockApp);

      const healthRouteCall = mockApp.get.mock.calls.find(call => call[0] === '/api/health');
      const healthHandler = healthRouteCall[1];

      const mockReq = global.testUtils.createMockReq();
      const mockRes = global.testUtils.createMockRes();
      const mockNext = global.testUtils.createMockNext();

      await healthHandler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: '3.0.0',
        environment: 'test',
        memory: expect.any(Object),
        nodeVersion: expect.any(String)
      });
    });
  });

  describe('GET /api/system/info', () => {
    it('should return system information', async () => {
      registerCoreRoutes(mockApp);

      const systemRouteCall = mockApp.get.mock.calls.find(call => call[0] === '/api/system/info');
      const systemHandler = systemRouteCall[1];

      const mockReq = global.testUtils.createMockReq();
      const mockRes = global.testUtils.createMockRes();
      const mockNext = global.testUtils.createMockNext();

      await systemHandler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        platform: expect.any(String),
        arch: expect.any(String),
        nodeVersion: expect.any(String),
        typescript: true,
        database: 'PostgreSQL',
        cache: 'Memory',
        features: expect.arrayContaining([
          'Regulatory Intelligence',
          'Legal Case Management',
          'AI-Powered Analysis'
        ])
      });
    });
  });

  describe('GET /api/ping', () => {
    it('should return pong for load balancer health checks', () => {
      registerCoreRoutes(mockApp);

      // Find the ping route handler
      const pingRouteCall = mockApp.get.mock.calls.find(call => call[0] === '/api/ping');
      expect(pingRouteCall).toBeDefined();

      const pingHandler = pingRouteCall[1];
      const mockReq = global.testUtils.createMockReq();
      const mockRes = global.testUtils.createMockRes();

      pingHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('pong');
    });
  });
});
