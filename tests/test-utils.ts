import { Vec3 } from 'vec3';

// Mock bot for testing
export function createMockBot(overrides: any = {}) {
  const defaultBot = {
    entity: {
      position: new Vec3(0, 64, 0)
    },
    inventory: {
      items: jest.fn(() => []),
    },
    blockAt: jest.fn(() => ({ name: 'air', type: 0, position: new Vec3(0, 0, 0) })),
    canSeeBlock: jest.fn(() => true),
    canDigBlock: jest.fn(() => true),
    placeBlock: jest.fn(),
    dig: jest.fn(),
    lookAt: jest.fn(),
    chat: jest.fn(),
    equip: jest.fn(),
    setControlState: jest.fn(),
    nearestEntity: jest.fn(() => null),
    findBlock: jest.fn(() => null),
    pathfinder: {
      goto: jest.fn(),
      setMovements: jest.fn(),
    },
    creative: {
      flyTo: jest.fn(),
      stopFlying: jest.fn(),
    },
    version: '1.19.2',
    username: 'TestBot',
    game: {
      gameMode: 'creative'
    },
    quit: jest.fn(),
    ...overrides
  };

  return defaultBot;
}

// Mock McpServer for testing
export function createMockMcpServer() {
  const tools: Record<string, any> = {};
  
  return {
    tool: jest.fn((name: string, description: string, schema: any, handler: any) => {
      tools[name] = { name, description, schema, handler };
    }),
    connect: jest.fn(),
    getRegisteredTools: () => tools,
  };
}

// Mock Vec3 helper
export function createMockVec3(x: number = 0, y: number = 0, z: number = 0) {
  return new Vec3(x, y, z);
}

// Mock minecraft data
export function createMockMinecraftData() {
  return {
    blocksByName: {
      stone: { id: 1 },
      dirt: { id: 3 },
      grass_block: { id: 2 },
    }
  };
}

// Test utilities
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function expectAsyncThrow(asyncFn: () => Promise<any>): Promise<any> {
  return expect(asyncFn()).rejects.toThrow();
}