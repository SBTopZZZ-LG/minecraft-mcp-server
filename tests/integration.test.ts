// Mock all the complex dependencies
jest.mock('mineflayer', () => ({
  createBot: jest.fn()
}));

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn()
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn()
}));

jest.mock('mineflayer-pathfinder', () => ({
  pathfinder: {},
  Movements: jest.fn(),
  goals: {
    GoalNear: jest.fn()
  }
}));

jest.mock('minecraft-data', () => {
  return jest.fn(() => ({
    blocksByName: {
      stone: { id: 1 }
    }
  }));
});

jest.mock('yargs', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    option: jest.fn().mockReturnThis(),
    help: jest.fn().mockReturnThis(),
    alias: jest.fn().mockReturnThis(),
    parseSync: jest.fn(() => ({
      host: 'localhost',
      port: 25565,
      username: 'TestBot'
    }))
  }))
}));

jest.mock('yargs/helpers', () => ({
  hideBin: jest.fn()
}));

import { parseCommandLineArgs } from '../src/cli-args';
import { createResponse, createErrorResponse } from '../src/response-helpers';
import { placeSingleBlock } from '../src/block-helpers';

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CLI Integration', () => {
    it('should parse command line arguments correctly', () => {
      const args = parseCommandLineArgs();
      
      expect(args).toEqual({
        host: 'localhost',
        port: 25565,
        username: 'TestBot'
      });
    });
  });

  describe('Response System Integration', () => {
    it('should create and handle responses consistently', () => {
      const successResponse = createResponse('Operation successful');
      const errorResponse = createErrorResponse('Something went wrong');

      expect(successResponse.content[0].text).toBe('Operation successful');
      expect(successResponse.isError).toBeUndefined();

      expect(errorResponse.content[0].text).toBe('Failed: Something went wrong');
      expect(errorResponse.isError).toBe(true);
    });
  });

  describe('Block System Integration', () => {
    it('should integrate block placement with bot interactions', async () => {
      const mockBot = {
        blockAt: jest.fn(),
        canSeeBlock: jest.fn(),
        canDigBlock: jest.fn(),
        placeBlock: jest.fn(),
        lookAt: jest.fn(),
        pathfinder: {
          goto: jest.fn()
        }
      };

      // Test successful placement
      mockBot.blockAt
        .mockReturnValueOnce({ name: 'air', type: 0 })  // target position is air
        .mockReturnValueOnce({ name: 'stone', type: 1 }); // reference block exists
      mockBot.canSeeBlock.mockReturnValue(true);
      mockBot.placeBlock.mockResolvedValue(undefined);

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Placed block at (1, 2, 3)');
      expect(mockBot.placeBlock).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors gracefully across all systems', async () => {
      // Test error response creation
      const error = new Error('Test error');
      const errorResponse = createErrorResponse(error);

      expect(errorResponse.isError).toBe(true);
      expect(errorResponse.content[0].text).toBe('Failed: Test error');

      // Test block placement error handling
      const mockBot = {
        blockAt: jest.fn(() => {
          throw new Error('Block access failed');
        })
      };

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error placing block');
    });
  });

  describe('Bot Tool Workflow Integration', () => {
    it('should simulate a complete tool execution workflow', async () => {
      // Create a mock bot with all necessary methods
      const mockBot = {
        entity: {
          position: { x: 0, y: 64, z: 0 }
        },
        inventory: {
          items: jest.fn(() => [
            { name: 'stone', count: 64, slot: 0 }
          ])
        },
        chat: jest.fn(),
        setControlState: jest.fn(),
        lookAt: jest.fn(),
        blockAt: jest.fn(() => ({ name: 'dirt', type: 3 })),
        pathfinder: {
          goto: jest.fn()
        }
      };

      // Simulate get-position tool
      const getPositionHandler = async () => {
        try {
          const position = mockBot.entity.position;
          const pos = {
            x: Math.floor(position.x),
            y: Math.floor(position.y),
            z: Math.floor(position.z)
          };
          return createResponse(`Current position: (${pos.x}, ${pos.y}, ${pos.z})`);
        } catch (error) {
          return createErrorResponse(error as Error);
        }
      };

      const positionResult = await getPositionHandler();
      expect(positionResult.content[0].text).toBe('Current position: (0, 64, 0)');

      // Simulate list-inventory tool
      const listInventoryHandler = async () => {
        try {
          const items = mockBot.inventory.items();
          if (items.length === 0) {
            return createResponse("Inventory is empty");
          }

          let inventoryText = `Found ${items.length} items in inventory:\n\n`;
          items.forEach((item: any) => {
            inventoryText += `- ${item.name} (x${item.count}) in slot ${item.slot}\n`;
          });

          return createResponse(inventoryText);
        } catch (error) {
          return createErrorResponse(error as Error);
        }
      };

      const inventoryResult = await listInventoryHandler();
      expect(inventoryResult.content[0].text).toContain('Found 1 items in inventory');
      expect(inventoryResult.content[0].text).toContain('stone (x64)');

      // Simulate send-chat tool
      const sendChatHandler = async (message: string) => {
        try {
          mockBot.chat(message);
          return createResponse(`Sent message: "${message}"`);
        } catch (error) {
          return createErrorResponse(error as Error);
        }
      };

      const chatResult = await sendChatHandler('Hello world!');
      expect(mockBot.chat).toHaveBeenCalledWith('Hello world!');
      expect(chatResult.content[0].text).toBe('Sent message: "Hello world!"');

      // Simulate jump tool
      const jumpHandler = async () => {
        try {
          mockBot.setControlState('jump', true);
          setTimeout(() => mockBot.setControlState('jump', false), 250);
          return createResponse("Successfully jumped");
        } catch (error) {
          return createErrorResponse(error as Error);
        }
      };

      const jumpResult = await jumpHandler();
      expect(mockBot.setControlState).toHaveBeenCalledWith('jump', true);
      expect(jumpResult.content[0].text).toBe('Successfully jumped');
    });
  });

  describe('Data Type Integration', () => {
    it('should handle Vec3 coordinates consistently', async () => {
      const { Vec3 } = require('vec3');
      
      // Test coordinate creation and usage
      const pos1 = new Vec3(1, 2, 3);
      const pos2 = new Vec3(4, 5, 6);
      
      expect(pos1.x).toBe(1);
      expect(pos1.y).toBe(2);
      expect(pos1.z).toBe(3);

      // Test coordinate operations
      const distance = pos1.distanceTo(pos2);
      expect(distance).toBeGreaterThan(0);

      // Test coordinate in response system
      const response = createResponse(`Position: (${pos1.x}, ${pos1.y}, ${pos1.z})`);
      expect(response.content[0].text).toBe('Position: (1, 2, 3)');
    });
  });

  describe('Mock System Validation', () => {
    it('should validate that all critical systems are properly mocked', () => {
      // Verify mineflayer mock
      const mineflayer = require('mineflayer');
      expect(mineflayer.createBot).toBeDefined();

      // Verify MCP SDK mocks
      const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
      expect(McpServer).toBeDefined();

      // Verify pathfinder mock
      const pathfinder = require('mineflayer-pathfinder');
      expect(pathfinder.goals.GoalNear).toBeDefined();

      // Verify minecraft-data mock
      const minecraftData = require('minecraft-data');
      const mcData = minecraftData();
      expect(mcData.blocksByName.stone).toBeDefined();
    });
  });
});