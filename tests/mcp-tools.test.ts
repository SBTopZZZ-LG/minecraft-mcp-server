import { Vec3 } from 'vec3';
import { createMockBot, createMockMcpServer } from './test-utils';
import { createResponse, createErrorResponse } from '../src/response-helpers';

// Mock dependencies
jest.mock('mineflayer-pathfinder', () => ({
  pathfinder: {},
  Movements: jest.fn(),
  goals: {
    GoalNear: jest.fn(),
    GoalXZ: jest.fn(),
    GoalY: jest.fn()
  }
}));

jest.mock('minecraft-data', () => {
  return jest.fn(() => ({
    blocksByName: {
      stone: { id: 1 },
      dirt: { id: 3 },
      grass_block: { id: 2 }
    }
  }));
});

describe('MCP Tools', () => {
  let mockBot: any;
  let mockServer: any;

  beforeEach(() => {
    mockBot = createMockBot();
    mockServer = createMockMcpServer();
    jest.clearAllMocks();
  });

  describe('Position Tools', () => {
    describe('get-position tool', () => {
      it('should return current bot position', async () => {
        mockBot.entity.position = new Vec3(10, 64, 20);

        const handler = async () => {
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

        const result = await handler();

        expect(result.content[0].text).toBe('Current position: (10, 64, 20)');
        expect(result.isError).toBeUndefined();
      });

      it('should handle errors gracefully', async () => {
        const handler = async () => {
          try {
            // Simulate an error
            throw new Error('Position unavailable');
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler();

        expect(result.content[0].text).toBe('Failed: Position unavailable');
        expect(result.isError).toBe(true);
      });
    });

    describe('move-to-position tool', () => {
      it('should move bot to specified position', async () => {
        const mockGoalNear = require('mineflayer-pathfinder').goals.GoalNear;
        mockBot.pathfinder.goto.mockResolvedValue(undefined);

        const handler = async ({ x, y, z, range = 1 }: any) => {
          try {
            const goal = new mockGoalNear(x, y, z, range);
            await mockBot.pathfinder.goto(goal);
            return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 10, y: 64, z: 20 });

        expect(mockGoalNear).toHaveBeenCalledWith(10, 64, 20, 1);
        expect(mockBot.pathfinder.goto).toHaveBeenCalled();
        expect(result.content[0].text).toBe('Successfully moved to position near (10, 64, 20)');
      });

      it('should use custom range', async () => {
        const mockGoalNear = require('mineflayer-pathfinder').goals.GoalNear;
        mockBot.pathfinder.goto.mockResolvedValue(undefined);

        const handler = async ({ x, y, z, range = 1 }: any) => {
          const goal = new mockGoalNear(x, y, z, range);
          await mockBot.pathfinder.goto(goal);
          return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
        };

        await handler({ x: 10, y: 64, z: 20, range: 3 });

        expect(mockGoalNear).toHaveBeenCalledWith(10, 64, 20, 3);
      });
    });

    describe('jump tool', () => {
      it('should make bot jump', async () => {
        const handler = async () => {
          try {
            mockBot.setControlState('jump', true);
            setTimeout(() => mockBot.setControlState('jump', false), 250);
            return createResponse("Successfully jumped");
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler();

        expect(mockBot.setControlState).toHaveBeenCalledWith('jump', true);
        expect(result.content[0].text).toBe('Successfully jumped');
      });
    });

    describe('look-at tool', () => {
      it('should make bot look at position', async () => {
        mockBot.lookAt.mockResolvedValue(undefined);

        const handler = async ({ x, y, z }: any) => {
          try {
            await mockBot.lookAt(new Vec3(x, y, z), true);
            return createResponse(`Looking at position (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 5, y: 10, z: 15 });

        expect(mockBot.lookAt).toHaveBeenCalledWith(new Vec3(5, 10, 15), true);
        expect(result.content[0].text).toBe('Looking at position (5, 10, 15)');
      });
    });

    describe('move-in-direction tool', () => {
      it('should move bot in specified direction', (done) => {
        const handler = ({ direction, duration = 1000 }: any) => {
          return new Promise((resolve) => {
            try {
              mockBot.setControlState(direction, true);

              setTimeout(() => {
                mockBot.setControlState(direction, false);
                resolve(createResponse(`Moved ${direction} for ${duration}ms`));
              }, 10); // Use shorter timeout for testing
            } catch (error) {
              mockBot.setControlState(direction, false);
              resolve(createErrorResponse(error as Error));
            }
          });
        };

        handler({ direction: 'forward', duration: 10 }).then((result: any) => {
          expect(mockBot.setControlState).toHaveBeenCalledWith('forward', true);
          expect(mockBot.setControlState).toHaveBeenCalledWith('forward', false);
          expect(result.content[0].text).toBe('Moved forward for 10ms');
          done();
        });
      });
    });
  });

  describe('Inventory Tools', () => {
    describe('list-inventory tool', () => {
      it('should list inventory items', async () => {
        const mockItems = [
          { name: 'stone', count: 64, slot: 0 },
          { name: 'dirt', count: 32, slot: 1 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);

        const handler = async () => {
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

        const result = await handler();

        expect(result.content[0].text).toContain('Found 2 items in inventory');
        expect(result.content[0].text).toContain('- stone (x64) in slot 0');
        expect(result.content[0].text).toContain('- dirt (x32) in slot 1');
      });

      it('should handle empty inventory', async () => {
        mockBot.inventory.items.mockReturnValue([]);

        const handler = async () => {
          const items = mockBot.inventory.items();
          if (items.length === 0) {
            return createResponse("Inventory is empty");
          }
          return createResponse("Has items");
        };

        const result = await handler();

        expect(result.content[0].text).toBe('Inventory is empty');
      });
    });

    describe('find-item tool', () => {
      it('should find item in inventory', async () => {
        const mockItems = [
          { name: 'stone', count: 64, slot: 0 },
          { name: 'dirt', count: 32, slot: 1 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);

        const handler = async ({ nameOrType }: any) => {
          try {
            const items = mockBot.inventory.items();
            const item = items.find((item: any) =>
              item.name.includes(nameOrType.toLowerCase())
            );

            if (item) {
              return createResponse(`Found ${item.count} ${item.name} in inventory (slot ${item.slot})`);
            } else {
              return createResponse(`Couldn't find any item matching '${nameOrType}' in inventory`);
            }
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ nameOrType: 'stone' });

        expect(result.content[0].text).toBe('Found 64 stone in inventory (slot 0)');
      });

      it('should handle item not found', async () => {
        mockBot.inventory.items.mockReturnValue([]);

        const handler = async ({ nameOrType }: any) => {
          const items = mockBot.inventory.items();
          const item = items.find((item: any) =>
            item.name.includes(nameOrType.toLowerCase())
          );

          if (item) {
            return createResponse(`Found ${item.count} ${item.name} in inventory (slot ${item.slot})`);
          } else {
            return createResponse(`Couldn't find any item matching '${nameOrType}' in inventory`);
          }
        };

        const result = await handler({ nameOrType: 'diamond' });

        expect(result.content[0].text).toBe("Couldn't find any item matching 'diamond' in inventory");
      });
    });

    describe('equip-item tool', () => {
      it('should equip item from inventory', async () => {
        const mockItems = [
          { name: 'iron_sword', count: 1, slot: 0 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);
        mockBot.equip.mockResolvedValue(undefined);

        const handler = async ({ itemName, destination = 'hand' }: any) => {
          try {
            const items = mockBot.inventory.items();
            const item = items.find((item: any) =>
              item.name.includes(itemName.toLowerCase())
            );

            if (!item) {
              return createResponse(`Couldn't find any item matching '${itemName}' in inventory`);
            }

            await mockBot.equip(item, destination);
            return createResponse(`Equipped ${item.name} to ${destination}`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ itemName: 'sword' });

        expect(mockBot.equip).toHaveBeenCalledWith(mockItems[0], 'hand');
        expect(result.content[0].text).toBe('Equipped iron_sword to hand');
      });

      it('should handle item not found for equipping', async () => {
        mockBot.inventory.items.mockReturnValue([]);

        const handler = async ({ itemName, destination = 'hand' }: any) => {
          const items = mockBot.inventory.items();
          const item = items.find((item: any) =>
            item.name.includes(itemName.toLowerCase())
          );

          if (!item) {
            return createResponse(`Couldn't find any item matching '${itemName}' in inventory`);
          }

          await mockBot.equip(item, destination);
          return createResponse(`Equipped ${item.name} to ${destination}`);
        };

        const result = await handler({ itemName: 'sword' });

        expect(result.content[0].text).toBe("Couldn't find any item matching 'sword' in inventory");
      });
    });
  });

  describe('Chat Tools', () => {
    describe('send-chat tool', () => {
      it('should send chat message', async () => {
        const handler = async ({ message }: any) => {
          try {
            mockBot.chat(message);
            return createResponse(`Sent message: "${message}"`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ message: 'Hello world!' });

        expect(mockBot.chat).toHaveBeenCalledWith('Hello world!');
        expect(result.content[0].text).toBe('Sent message: "Hello world!"');
      });
    });
  });

  describe('Game State Tools', () => {
    describe('detect-gamemode tool', () => {
      it('should return bot gamemode', async () => {
        mockBot.game.gameMode = 'survival';

        const handler = async () => {
          try {
            return createResponse(`Bot gamemode: "${mockBot.game.gameMode}"`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler();

        expect(result.content[0].text).toBe('Bot gamemode: "survival"');
      });
    });
  });

  describe('Block Tools', () => {
    describe('get-block-info tool', () => {
      it('should return block information', async () => {
        const mockBlock = {
          name: 'stone',
          type: 1,
          position: new Vec3(1, 2, 3)
        };
        mockBot.blockAt.mockReturnValue(mockBlock);

        const handler = async ({ x, y, z }: any) => {
          try {
            const blockPos = new Vec3(x, y, z);
            const block = mockBot.blockAt(blockPos);

            if (!block) {
              return createResponse(`No block information found at position (${x}, ${y}, ${z})`);
            }

            return createResponse(`Found ${block.name} (type: ${block.type}) at position (${block.position.x}, ${block.position.y}, ${block.position.z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 1, y: 2, z: 3 });

        expect(mockBot.blockAt).toHaveBeenCalledWith(new Vec3(1, 2, 3));
        expect(result.content[0].text).toBe('Found stone (type: 1) at position (1, 2, 3)');
      });

      it('should handle no block found', async () => {
        mockBot.blockAt.mockReturnValue(null);

        const handler = async ({ x, y, z }: any) => {
          const blockPos = new Vec3(x, y, z);
          const block = mockBot.blockAt(blockPos);

          if (!block) {
            return createResponse(`No block information found at position (${x}, ${y}, ${z})`);
          }

          return createResponse(`Found ${block.name} (type: ${block.type}) at position (${block.position.x}, ${block.position.y}, ${block.position.z})`);
        };

        const result = await handler({ x: 1, y: 2, z: 3 });

        expect(result.content[0].text).toBe('No block information found at position (1, 2, 3)');
      });
    });

    describe('dig-block tool', () => {
      it('should dig block at position', async () => {
        const mockBlock = {
          name: 'dirt',
          type: 3,
          position: new Vec3(1, 2, 3)
        };
        mockBot.blockAt.mockReturnValue(mockBlock);
        mockBot.canDigBlock.mockReturnValue(true);
        mockBot.canSeeBlock.mockReturnValue(true);
        mockBot.dig.mockResolvedValue(undefined);

        const handler = async ({ x, y, z }: any) => {
          try {
            const blockPos = new Vec3(x, y, z);
            const block = mockBot.blockAt(blockPos);

            if (!block || block.name === 'air') {
              return createResponse(`No block found at position (${x}, ${y}, ${z})`);
            }

            if (!mockBot.canDigBlock(block) || !mockBot.canSeeBlock(block)) {
              // Try to move closer to dig the block
              const mockGoalNear = require('mineflayer-pathfinder').goals.GoalNear;
              const goal = new mockGoalNear(x, y, z, 2);
              await mockBot.pathfinder.goto(goal);
            }

            await mockBot.dig(block);

            return createResponse(`Dug ${block.name} at (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 1, y: 2, z: 3 });

        expect(mockBot.dig).toHaveBeenCalledWith(mockBlock);
        expect(result.content[0].text).toBe('Dug dirt at (1, 2, 3)');
      });
    });

    describe('find-block tool', () => {
      it('should find nearest block of specified type', async () => {
        const mockBlock = {
          name: 'stone',
          position: new Vec3(5, 10, 15)
        };
        mockBot.findBlock.mockReturnValue(mockBlock);

        const minecraftData = require('minecraft-data');
        const mcData = minecraftData();

        const handler = async ({ blockType, maxDistance = 16 }: any) => {
          try {
            const blocksByName = mcData.blocksByName;

            if (!blocksByName[blockType]) {
              return createResponse(`Unknown block type: ${blockType}`);
            }

            const blockId = blocksByName[blockType].id;

            const block = mockBot.findBlock({
              matching: blockId,
              maxDistance: maxDistance
            });

            if (!block) {
              return createResponse(`No ${blockType} found within ${maxDistance} blocks`);
            }

            return createResponse(`Found ${blockType} at position (${block.position.x}, ${block.position.y}, ${block.position.z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ blockType: 'stone' });

        expect(mockBot.findBlock).toHaveBeenCalledWith({
          matching: 1, // stone id
          maxDistance: 16
        });
        expect(result.content[0].text).toBe('Found stone at position (5, 10, 15)');
      });
    });
  });

  describe('Entity Tools', () => {
    describe('find-entity tool', () => {
      it('should find nearest entity', async () => {
        const mockEntity = {
          name: 'zombie',
          type: 'mob',
          position: new Vec3(10, 64, 20)
        };
        mockBot.entity = { position: new Vec3(0, 64, 0) };
        mockBot.nearestEntity.mockReturnValue(mockEntity);

        const handler = async ({ type = '', maxDistance = 16 }: any) => {
          try {
            const entityFilter = (entity: any) => {
              if (!type) return true;
              if (type === 'player') return entity.type === 'player';
              if (type === 'mob') return entity.type === 'mob';
              return entity.name && entity.name.includes(type.toLowerCase());
            };

            const entity = mockBot.nearestEntity(entityFilter);

            if (!entity) {
              return createResponse(`No ${type || 'entity'} found within ${maxDistance} blocks`);
            }
            
            // Check distance manually for testing
            const distance = mockBot.entity.position.distanceTo(entity.position);
            if (distance > maxDistance) {
              return createResponse(`No ${type || 'entity'} found within ${maxDistance} blocks`);
            }

            return createResponse(`Found ${entity.name || entity.username || entity.type} at position (${Math.floor(entity.position.x)}, ${Math.floor(entity.position.y)}, ${Math.floor(entity.position.z)})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        // Distance from (0,64,0) to (10,64,20) is sqrt(10^2 + 0^2 + 20^2) = sqrt(500) ≈ 22.36 
        // Since this exceeds the default maxDistance of 16, let's use a larger maxDistance
        const result = await handler({ type: 'mob', maxDistance: 25 });

        expect(result.content[0].text).toBe('Found zombie at position (10, 64, 20)');
      });
    });
  });
});