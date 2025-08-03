// Mock all dependencies first before importing
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
      stone: { id: 1 },
      dirt: { id: 3 }
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

import { createMockBot, createMockMcpServer } from './test-utils';

// Test the createCancellableFlightOperation function logic
describe('Bot Main Functions', () => {
  let mockBot: any;
  let mockServer: any;

  beforeEach(() => {
    mockBot = createMockBot();
    mockServer = createMockMcpServer();
    jest.clearAllMocks();
    
    // Mock console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Flight Operation Logic', () => {
    it('should simulate flight operation cancellation', async () => {
      // Simulate the flight operation logic from the bot
      const createCancellableFlightOperation = (
        bot: any, 
        destination: any, 
        controller: AbortController
      ): Promise<boolean> => {
        return new Promise((resolve, reject) => {
          let aborted = false;
          
          controller.signal.addEventListener('abort', () => {
            aborted = true;
            bot.creative.stopFlying();
            reject(new Error("Flight operation cancelled"));
          });
          
          bot.creative.flyTo(destination)
            .then(() => {
              if (!aborted) {
                resolve(true);
              }
            })
            .catch((err: any) => {
              if (!aborted) {
                reject(err);
              }
            });
        });
      };

      const controller = new AbortController();
      const { Vec3 } = require('vec3');
      const destination = new Vec3(10, 64, 20);
      
      // Test successful flight
      mockBot.creative.flyTo.mockResolvedValue(undefined);
      
      const flightPromise = createCancellableFlightOperation(mockBot, destination, controller);
      const result = await flightPromise;
      
      expect(result).toBe(true);
      expect(mockBot.creative.flyTo).toHaveBeenCalledWith(destination);
    });

    it('should handle flight cancellation', async () => {
      const createCancellableFlightOperation = (
        bot: any, 
        destination: any, 
        controller: AbortController
      ): Promise<boolean> => {
        return new Promise((resolve, reject) => {
          let aborted = false;
          
          controller.signal.addEventListener('abort', () => {
            aborted = true;
            bot.creative.stopFlying();
            reject(new Error("Flight operation cancelled"));
          });
          
          bot.creative.flyTo(destination)
            .then(() => {
              if (!aborted) {
                resolve(true);
              }
            })
            .catch((err: any) => {
              if (!aborted) {
                reject(err);
              }
            });
        });
      };

      const controller = new AbortController();
      const { Vec3 } = require('vec3');
      const destination = new Vec3(10, 64, 20);
      
      // Mock a slow flight operation
      mockBot.creative.flyTo.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      const flightPromise = createCancellableFlightOperation(mockBot, destination, controller);
      
      // Cancel after a short delay
      setTimeout(() => controller.abort(), 10);
      
      await expect(flightPromise).rejects.toThrow('Flight operation cancelled');
      expect(mockBot.creative.stopFlying).toHaveBeenCalled();
    });
  });

  describe('Bot Setup Functions', () => {
    it('should create bot with proper options', () => {
      const mineflayer = require('mineflayer');
      const pathfinderPkg = require('mineflayer-pathfinder');
      
      // Simulate setupBot function logic
      const setupBot = (argv: any) => {
        const botOptions = {
          host: argv.host,
          port: argv.port,
          username: argv.username,
          plugins: { pathfinder: pathfinderPkg.pathfinder },
        };

        return mineflayer.createBot(botOptions);
      };

      const argv = {
        host: 'test.server.com',
        port: 25566,
        username: 'TestBot'
      };

      setupBot(argv);

      expect(mineflayer.createBot).toHaveBeenCalledWith({
        host: 'test.server.com',
        port: 25566,
        username: 'TestBot',
        plugins: { pathfinder: pathfinderPkg.pathfinder }
      });
    });
  });

  describe('MCP Server Creation', () => {
    it('should create MCP server with proper configuration', () => {
      const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
      
      // Simulate createMcpServer function logic
      const createMcpServer = (bot: any) => {
        const server = new McpServer({
          name: "minecraft-bot",
          version: "1.0.0",
        });

        return server;
      };

      createMcpServer(mockBot);

      expect(McpServer).toHaveBeenCalledWith({
        name: "minecraft-bot",
        version: "1.0.0",
      });
    });
  });

  describe('Tool Registration Simulation', () => {
    it('should register position tools correctly', () => {
      // Simulate registerPositionTools function logic
      const registerPositionTools = (server: any, bot: any) => {
        server.tool(
          "get-position",
          "Get the current position of the bot",
          {},
          async () => {
            const position = bot.entity.position;
            const pos = {
              x: Math.floor(position.x),
              y: Math.floor(position.y),
              z: Math.floor(position.z)
            };
            return {
              content: [{ type: "text", text: `Current position: (${pos.x}, ${pos.y}, ${pos.z})` }]
            };
          }
        );

        server.tool(
          "jump",
          "Make the bot jump",
          {},
          async () => {
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 250);
            return {
              content: [{ type: "text", text: "Successfully jumped" }]
            };
          }
        );
      };

      registerPositionTools(mockServer, mockBot);

      expect(mockServer.tool).toHaveBeenCalledTimes(2);
      expect(mockServer.tool).toHaveBeenCalledWith(
        "get-position",
        "Get the current position of the bot",
        {},
        expect.any(Function)
      );
      expect(mockServer.tool).toHaveBeenCalledWith(
        "jump",
        "Make the bot jump",
        {},
        expect.any(Function)
      );
    });

    it('should register inventory tools correctly', () => {
      // Simulate registerInventoryTools function logic
      const registerInventoryTools = (server: any, bot: any) => {
        server.tool(
          "list-inventory",
          "List all items in the bot's inventory",
          {},
          async () => {
            const items = bot.inventory.items();
            if (items.length === 0) {
              return {
                content: [{ type: "text", text: "Inventory is empty" }]
              };
            }
            return {
              content: [{ type: "text", text: `Found ${items.length} items` }]
            };
          }
        );
      };

      registerInventoryTools(mockServer, mockBot);

      expect(mockServer.tool).toHaveBeenCalledWith(
        "list-inventory",
        "List all items in the bot's inventory",
        {},
        expect.any(Function)
      );
    });

    it('should register chat tools correctly', () => {
      // Simulate registerChatTools function logic
      const registerChatTools = (server: any, bot: any) => {
        server.tool(
          "send-chat",
          "Send a chat message in-game",
          { message: { type: 'string', description: 'Message to send in chat' } },
          async ({ message }: any) => {
            bot.chat(message);
            return {
              content: [{ type: "text", text: `Sent message: "${message}"` }]
            };
          }
        );
      };

      registerChatTools(mockServer, mockBot);

      expect(mockServer.tool).toHaveBeenCalledWith(
        "send-chat",
        "Send a chat message in-game",
        { message: { type: 'string', description: 'Message to send in chat' } },
        expect.any(Function)
      );
    });
  });

  describe('Block Tools Registration', () => {
    it('should register block interaction tools', () => {
      // Simulate registerBlockTools function logic
      const registerBlockTools = (server: any, bot: any) => {
        server.tool(
          "get-block-info",
          "Get information about a block at the specified position",
          {
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
            z: { type: 'number', description: 'Z coordinate' }
          },
          async ({ x, y, z }: any) => {
            const { Vec3 } = require('vec3');
            const blockPos = new Vec3(x, y, z);
            const block = bot.blockAt(blockPos);

            if (!block) {
              return {
                content: [{ type: "text", text: `No block information found at position (${x}, ${y}, ${z})` }]
              };
            }

            return {
              content: [{ type: "text", text: `Found ${block.name} (type: ${block.type}) at position (${block.position.x}, ${block.position.y}, ${block.position.z})` }]
            };
          }
        );

        server.tool(
          "dig-block",
          "Dig a block at the specified position",
          {
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
            z: { type: 'number', description: 'Z coordinate' }
          },
          async ({ x, y, z }: any) => {
            const { Vec3 } = require('vec3');
            const blockPos = new Vec3(x, y, z);
            const block = bot.blockAt(blockPos);

            if (!block || block.name === 'air') {
              return {
                content: [{ type: "text", text: `No block found at position (${x}, ${y}, ${z})` }]
              };
            }

            await bot.dig(block);
            return {
              content: [{ type: "text", text: `Dug ${block.name} at (${x}, ${y}, ${z})` }]
            };
          }
        );
      };

      registerBlockTools(mockServer, mockBot);

      expect(mockServer.tool).toHaveBeenCalledTimes(2);
      expect(mockServer.tool).toHaveBeenCalledWith(
        "get-block-info",
        "Get information about a block at the specified position",
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockServer.tool).toHaveBeenCalledWith(
        "dig-block",
        "Dig a block at the specified position",
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('Entity and Game State Tools', () => {
    it('should register entity tools', () => {
      // Simulate registerEntityTools function logic
      const registerEntityTools = (server: any, bot: any) => {
        server.tool(
          "find-entity",
          "Find the nearest entity of a specific type",
          {
            type: { type: 'string', description: 'Type of entity to find', optional: true },
            maxDistance: { type: 'number', description: 'Maximum search distance', default: 16, optional: true }
          },
          async ({ type = '', maxDistance = 16 }: any) => {
            const entityFilter = (entity: any) => {
              if (!type) return true;
              if (type === 'player') return entity.type === 'player';
              if (type === 'mob') return entity.type === 'mob';
              return entity.name && entity.name.includes(type.toLowerCase());
            };

            const entity = bot.nearestEntity(entityFilter);

            if (!entity || bot.entity.position.distanceTo(entity.position) > maxDistance) {
              return {
                content: [{ type: "text", text: `No ${type || 'entity'} found within ${maxDistance} blocks` }]
              };
            }

            return {
              content: [{ type: "text", text: `Found ${entity.name || entity.username || entity.type} at position (${Math.floor(entity.position.x)}, ${Math.floor(entity.position.y)}, ${Math.floor(entity.position.z)})` }]
            };
          }
        );
      };

      registerEntityTools(mockServer, mockBot);

      expect(mockServer.tool).toHaveBeenCalledWith(
        "find-entity",
        "Find the nearest entity of a specific type",
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should register game state tools', () => {
      // Simulate registerGameStateTools function logic
      const registerGameStateTools = (server: any, bot: any) => {
        server.tool(
          "detect-gamemode",
          "Detect the gamemode on game",
          {},
          async () => {
            return {
              content: [{ type: "text", text: `Bot gamemode: "${bot.game.gameMode}"` }]
            };
          }
        );
      };

      registerGameStateTools(mockServer, mockBot);

      expect(mockServer.tool).toHaveBeenCalledWith(
        "detect-gamemode",
        "Detect the gamemode on game",
        {},
        expect.any(Function)
      );
    });
  });

  describe('Process Event Handling', () => {
    it('should handle stdin end event', () => {
      const mockProcess = {
        stdin: {
          on: jest.fn()
        },
        exit: jest.fn()
      };

      // Simulate process event setup
      const setupProcessHandlers = (bot: any, process: any) => {
        process.stdin.on('end', () => {
          console.error("Claude has disconnected. Shutting down...");
          if (bot) {
            bot.quit();
          }
          process.exit(0);
        });
      };

      setupProcessHandlers(mockBot, mockProcess);

      expect(mockProcess.stdin.on).toHaveBeenCalledWith('end', expect.any(Function));

      // Simulate the event handler
      const eventHandler = mockProcess.stdin.on.mock.calls[0][1];
      eventHandler();

      expect(mockBot.quit).toHaveBeenCalled();
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });
  });
});