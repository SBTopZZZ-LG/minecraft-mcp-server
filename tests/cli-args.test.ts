import { parseCommandLineArgs, BotOptions } from '../src/cli-args';

// Mock yargs to avoid ES module issues
const mockYargsInstance = {
  option: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  parseSync: jest.fn()
};

jest.mock('yargs', () => {
  return {
    __esModule: true,
    default: jest.fn(() => mockYargsInstance)
  };
});

jest.mock('yargs/helpers', () => ({
  hideBin: jest.fn()
}));

describe('CLI Args Parser', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementation
    require('yargs/helpers').hideBin.mockReturnValue(['node', 'bot.js']);
  });

  describe('parseCommandLineArgs', () => {
    it('should return default values when no arguments provided', () => {
      // Mock parseSync to return default values
      mockYargsInstance.parseSync.mockReturnValue({
        host: 'localhost',
        port: 25565,
        username: 'LLMBot'
      });

      const result: BotOptions = parseCommandLineArgs();

      expect(result).toEqual({
        host: 'localhost',
        port: 25565,
        username: 'LLMBot'
      });
    });

    it('should parse custom host', () => {
      mockYargsInstance.parseSync.mockReturnValue({
        host: 'example.com',
        port: 25565,
        username: 'LLMBot'
      });

      const result: BotOptions = parseCommandLineArgs();

      expect(result.host).toBe('example.com');
      expect(result.port).toBe(25565);
      expect(result.username).toBe('LLMBot');
    });

    it('should parse custom port', () => {
      mockYargsInstance.parseSync.mockReturnValue({
        host: 'localhost',
        port: 8080,
        username: 'LLMBot'
      });

      const result: BotOptions = parseCommandLineArgs();

      expect(result.host).toBe('localhost');
      expect(result.port).toBe(8080);
      expect(result.username).toBe('LLMBot');
    });

    it('should parse custom username', () => {
      mockYargsInstance.parseSync.mockReturnValue({
        host: 'localhost',
        port: 25565,
        username: 'MyBot'
      });

      const result: BotOptions = parseCommandLineArgs();

      expect(result.host).toBe('localhost');
      expect(result.port).toBe(25565);
      expect(result.username).toBe('MyBot');
    });

    it('should parse all custom options', () => {
      mockYargsInstance.parseSync.mockReturnValue({
        host: 'custom.server.com',
        port: 9999,
        username: 'CustomBot'
      });

      const result: BotOptions = parseCommandLineArgs();

      expect(result).toEqual({
        host: 'custom.server.com',
        port: 9999,
        username: 'CustomBot'
      });
    });

    it('should call yargs with proper configuration', () => {
      mockYargsInstance.parseSync.mockReturnValue({
        host: 'localhost',
        port: 25565,
        username: 'LLMBot'
      });

      parseCommandLineArgs();

      // Verify yargs was called and configured properly
      expect(require('yargs').default).toHaveBeenCalled();
      expect(mockYargsInstance.option).toHaveBeenCalledWith('host', expect.objectContaining({
        type: 'string',
        description: 'Minecraft server host',
        default: 'localhost'
      }));
      expect(mockYargsInstance.option).toHaveBeenCalledWith('port', expect.objectContaining({
        type: 'number',
        description: 'Minecraft server port',
        default: 25565
      }));
      expect(mockYargsInstance.option).toHaveBeenCalledWith('username', expect.objectContaining({
        type: 'string',
        description: 'Bot username',
        default: 'LLMBot'
      }));
    });
  });
});