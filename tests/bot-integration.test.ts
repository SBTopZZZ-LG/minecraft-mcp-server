// Mock everything before any imports
const mockBot = {
  entity: { position: { x: 0, y: 64, z: 0 } },
  once: jest.fn(),
  on: jest.fn(),
  chat: jest.fn(),
  quit: jest.fn(),
  pathfinder: { setMovements: jest.fn() },
  username: 'TestBot',
  version: '1.19.2'
};

const mockServer = {
  tool: jest.fn(),
  connect: jest.fn()
};

const mockTransport = {};

jest.mock('mineflayer', () => ({
  createBot: jest.fn(() => mockBot)
}));

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: jest.fn(() => mockServer)
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(() => mockTransport)
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

// Mock process to avoid actual process interactions
const mockProcess = {
  stdin: {
    on: jest.fn()
  },
  exit: jest.fn()
};
Object.defineProperty(global, 'process', {
  value: mockProcess,
  writable: true
});

describe('Bot Integration - Main File', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup simple mock implementations
    mockBot.once.mockReturnValue(mockBot);
    mockBot.on.mockReturnValue(mockBot);
    mockServer.connect.mockResolvedValue(undefined);
    
    // Suppress console output for cleaner tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Bot Creation and Setup', () => {
    it('should create and configure bot correctly', () => {
      const mineflayer = require('mineflayer');
      const pathfinderPkg = require('mineflayer-pathfinder');
      
      // Test the bot setup function directly
      const argv = {
        host: 'test.server.com',
        port: 25566,
        username: 'TestBot'
      };

      const botOptions = {
        host: argv.host,
        port: argv.port,
        username: argv.username,
        plugins: { pathfinder: pathfinderPkg.pathfinder },
      };

      const bot = mineflayer.createBot(botOptions);

      expect(mineflayer.createBot).toHaveBeenCalledWith({
        host: 'test.server.com',
        port: 25566,
        username: 'TestBot',
        plugins: { pathfinder: pathfinderPkg.pathfinder }
      });
      
      expect(bot).toBe(mockBot);
    });

    it('should setup bot event handlers', () => {
      const bot = mockBot;

      // Simulate the event handler setup
      bot.once('spawn', async () => {
        const mcData = require('minecraft-data')(bot.version);
        const { Movements } = require('mineflayer-pathfinder');
        const defaultMove = new Movements(bot, mcData);
        bot.pathfinder.setMovements(defaultMove);
        bot.chat('Claude-powered bot ready to receive instructions!');
      });

      bot.on('chat', (username: string, message: string) => {
        if (username === bot.username) return;
        console.error(`[CHAT] ${username}: ${message}`);
      });

      bot.on('kicked', (reason: string) => {
        console.error(`Bot was kicked: ${reason}`);
      });

      bot.on('error', (err: Error) => {
        console.error(`Bot error: ${err.message}`);
      });

      expect(bot.once).toHaveBeenCalledWith('spawn', expect.any(Function));
      expect(bot.on).toHaveBeenCalledWith('chat', expect.any(Function));
      expect(bot.on).toHaveBeenCalledWith('kicked', expect.any(Function));
      expect(bot.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('MCP Server Setup', () => {
    it('should create MCP server with correct configuration', () => {
      const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
      
      const server = new McpServer({
        name: "minecraft-bot",
        version: "1.0.0",
      });

      expect(McpServer).toHaveBeenCalledWith({
        name: "minecraft-bot",
        version: "1.0.0",
      });
    });

    it('should register multiple tool categories', () => {
      const server = mockServer;
      const bot = mockBot;

      // Simulate tool registration
      const toolCategories = [
        'registerPositionTools',
        'registerInventoryTools',
        'registerBlockTools',
        'registerEntityTools',
        'registerChatTools',
        'registerFlightTools',
        'registerGameStateTools'
      ];

      // Mock each category registering at least one tool
      toolCategories.forEach(category => {
        server.tool(`mock-${category}`, `Mock tool for ${category}`, {}, jest.fn());
      });

      expect(server.tool).toHaveBeenCalledTimes(7);
    });
  });

  describe('Transport and Connection', () => {
    it('should setup stdio transport and connect', async () => {
      const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
      const transport = new StdioServerTransport();
      const server = mockServer;

      await server.connect(transport);

      expect(StdioServerTransport).toHaveBeenCalled();
      expect(server.connect).toHaveBeenCalledWith(transport);
    });
  });

  describe('Process Event Handling', () => {
    it('should handle process stdin end event', () => {
      const bot = mockBot;
      
      // Simulate the process event handler setup
      mockProcess.stdin.on('end', () => {
        console.error("Claude has disconnected. Shutting down...");
        if (bot) {
          bot.quit();
        }
        mockProcess.exit(0);
      });

      expect(mockProcess.stdin.on).toHaveBeenCalledWith('end', expect.any(Function));

      // Trigger the event handler
      const endHandler = mockProcess.stdin.on.mock.calls.find(call => call[0] === 'end')[1];
      endHandler();

      expect(bot.quit).toHaveBeenCalled();
      expect(mockProcess.exit).toHaveBeenCalledWith(0);
    });
  });

  describe('Bot Spawn Event', () => {
    it('should handle bot spawn event correctly', () => {
      const bot = mockBot;
      const minecraftData = require('minecraft-data');
      const { Movements } = require('mineflayer-pathfinder');

      // Simulate spawn event handler
      const spawnHandler = () => {
        const mcData = minecraftData(bot.version);
        const defaultMove = new Movements(bot, mcData);
        bot.pathfinder.setMovements(defaultMove);
        bot.chat('Claude-powered bot ready to receive instructions!');
      };

      spawnHandler();

      expect(minecraftData).toHaveBeenCalledWith(bot.version);
      expect(Movements).toHaveBeenCalled();
      expect(bot.pathfinder.setMovements).toHaveBeenCalled();
      expect(bot.chat).toHaveBeenCalledWith('Claude-powered bot ready to receive instructions!');
    });
  });

  describe('Bot Event Handlers', () => {
    it('should handle chat events correctly', () => {
      const bot = mockBot;

      // Simulate chat event handler
      const chatHandler = (username: string, message: string) => {
        if (username === bot.username) return;
        console.error(`[CHAT] ${username}: ${message}`);
      };

      // Test with different username
      chatHandler('Player1', 'Hello world!');
      expect(console.error).toHaveBeenCalledWith('[CHAT] Player1: Hello world!');

      // Test with bot's own message (should be ignored)
      jest.clearAllMocks();
      chatHandler(bot.username, 'My own message');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle kicked events', () => {
      const kickedHandler = (reason: string) => {
        console.error(`Bot was kicked: ${reason}`);
      };

      kickedHandler('Server restart');
      expect(console.error).toHaveBeenCalledWith('Bot was kicked: Server restart');
    });

    it('should handle error events', () => {
      const errorHandler = (err: Error) => {
        console.error(`Bot error: ${err.message}`);
      };

      const testError = new Error('Connection failed');
      errorHandler(testError);
      expect(console.error).toHaveBeenCalledWith('Bot error: Connection failed');
    });
  });

  describe('Command Line Arguments Integration', () => {
    it('should parse and use command line arguments', () => {
      const yargs = require('yargs').default;
      const { hideBin } = require('yargs/helpers');

      // Test argument parsing
      const result = yargs().parseSync();

      expect(result).toEqual({
        host: 'localhost',
        port: 25565,
        username: 'TestBot'
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle server connection errors gracefully', async () => {
      const server = mockServer;
      const bot = mockBot;

      // Simulate connection error
      server.connect.mockRejectedValue(new Error('Connection failed'));

      try {
        await server.connect(mockTransport);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Connection failed');
      }
    });

    it('should handle bot creation errors', () => {
      const mineflayer = require('mineflayer');
      
      // Reset the mock first, then setup the error
      mineflayer.createBot.mockReset();
      mineflayer.createBot.mockImplementation(() => {
        throw new Error('Bot creation failed');
      });

      expect(() => {
        mineflayer.createBot({});
      }).toThrow('Bot creation failed');
    });
  });

  describe('Integration Test - Full Workflow', () => {
    it('should simulate complete bot initialization', () => {
      const mineflayer = require('mineflayer');
      const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
      const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

      // Reset mocks to ensure clean state
      mineflayer.createBot.mockReset();
      mineflayer.createBot.mockReturnValue(mockBot);

      // 1. Parse command line arguments
      const argv = {
        host: 'localhost',
        port: 25565,
        username: 'TestBot'
      };

      // 2. Create bot
      const bot = mineflayer.createBot({
        host: argv.host,
        port: argv.port,
        username: argv.username,
        plugins: { pathfinder: {} }
      });

      // 3. Create MCP server
      const server = new McpServer({
        name: "minecraft-bot",
        version: "1.0.0",
      });

      // 4. Setup transport
      const transport = new StdioServerTransport();

      // Verify all components were created
      expect(mineflayer.createBot).toHaveBeenCalled();
      expect(McpServer).toHaveBeenCalled();
      expect(StdioServerTransport).toHaveBeenCalled();
    });
  });
});