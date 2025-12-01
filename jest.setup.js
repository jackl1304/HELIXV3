// Jest setup file for Helix Regulatory Intelligence Platform
import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/helix_test';

// Global test utilities
global.testUtils = {
  // Helper to create mock request/response objects
  createMockReq: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    get: jest.fn((header) => undefined),
    ...overrides
  }),

  createMockRes: (overrides = {}) => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    ...overrides
  }),

  createMockNext: () => jest.fn(),

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create test data
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date(),
    ...overrides
  }),

  createTestRegulatoryUpdate: (overrides = {}) => ({
    id: 'test-update-id',
    title: 'Test Regulatory Update',
    description: 'Test description',
    source: 'FDA',
    publishedAt: new Date(),
    jurisdiction: 'US',
    ...overrides
  })
};

// Mock external dependencies
jest.mock('./server/services/logger.service.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('./server/utils/database.js', () => ({
  dbManager: {
    query: jest.fn(),
    transaction: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue({ healthy: true })
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([])
  }))
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
