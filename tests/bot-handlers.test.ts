// Test individual tool handlers that would be extracted from bot.ts
import { createMockBot } from './test-utils';
import { createResponse, createErrorResponse } from '../src/response-helpers';
import { Vec3 } from 'vec3';

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

describe('Bot Tool Handlers', () => {
  let mockBot: any;

  beforeEach(() => {
    mockBot = createMockBot();
    jest.clearAllMocks();
  });

  describe('Position Tools', () => {
    describe('get-position handler', () => {
      it('should return formatted position', async () => {
        mockBot.entity.position = new Vec3(10.7, 64.2, 20.9);

        const handler = async (): Promise<any> => {
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

      it('should handle missing entity gracefully', async () => {
        mockBot.entity = null;

        const handler = async (): Promise<any> => {
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

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Failed:');
      });
    });

    describe('move-to-position handler', () => {
      it('should move to target with default range', async () => {
        const mockGoalNear = require('mineflayer-pathfinder').goals.GoalNear;
        mockBot.pathfinder.goto.mockResolvedValue(undefined);

        const handler = async ({ x, y, z, range = 1 }: any): Promise<any> => {
          try {
            const goal = new mockGoalNear(x, y, z, range);
            await mockBot.pathfinder.goto(goal);

            return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 5, y: 10, z: 15 });

        expect(mockGoalNear).toHaveBeenCalledWith(5, 10, 15, 1);
        expect(mockBot.pathfinder.goto).toHaveBeenCalled();
        expect(result.content[0].text).toBe('Successfully moved to position near (5, 10, 15)');
      });

      it('should move to target with custom range', async () => {
        const mockGoalNear = require('mineflayer-pathfinder').goals.GoalNear;
        mockBot.pathfinder.goto.mockResolvedValue(undefined);

        const handler = async ({ x, y, z, range = 1 }: any): Promise<any> => {
          try {
            const goal = new mockGoalNear(x, y, z, range);
            await mockBot.pathfinder.goto(goal);

            return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 5, y: 10, z: 15, range: 3 });

        expect(mockGoalNear).toHaveBeenCalledWith(5, 10, 15, 3);
        expect(result.content[0].text).toBe('Successfully moved to position near (5, 10, 15)');
      });

      it('should handle pathfinding errors', async () => {
        const mockGoalNear = require('mineflayer-pathfinder').goals.GoalNear;
        mockBot.pathfinder.goto.mockRejectedValue(new Error('Path blocked'));

        const handler = async ({ x, y, z, range = 1 }: any): Promise<any> => {
          try {
            const goal = new mockGoalNear(x, y, z, range);
            await mockBot.pathfinder.goto(goal);

            return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 5, y: 10, z: 15 });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Failed: Path blocked');
      });
    });

    describe('look-at handler', () => {
      it('should look at specified coordinates', async () => {
        mockBot.lookAt.mockResolvedValue(undefined);

        const handler = async ({ x, y, z }: any): Promise<any> => {
          try {
            await mockBot.lookAt(new Vec3(x, y, z), true);

            return createResponse(`Looking at position (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 1, y: 2, z: 3 });

        expect(mockBot.lookAt).toHaveBeenCalledWith(new Vec3(1, 2, 3), true);
        expect(result.content[0].text).toBe('Looking at position (1, 2, 3)');
      });

      it('should handle look-at errors', async () => {
        mockBot.lookAt.mockRejectedValue(new Error('Cannot look at target'));

        const handler = async ({ x, y, z }: any): Promise<any> => {
          try {
            await mockBot.lookAt(new Vec3(x, y, z), true);

            return createResponse(`Looking at position (${x}, ${y}, ${z})`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ x: 1, y: 2, z: 3 });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Failed: Cannot look at target');
      });
    });

    describe('jump handler', () => {
      it('should execute jump command', async () => {
        const handler = async (): Promise<any> => {
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

      it('should handle jump errors', async () => {
        mockBot.setControlState.mockImplementation(() => {
          throw new Error('Control state error');
        });

        const handler = async (): Promise<any> => {
          try {
            mockBot.setControlState('jump', true);
            setTimeout(() => mockBot.setControlState('jump', false), 250);

            return createResponse("Successfully jumped");
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler();

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Failed: Control state error');
      });
    });

    describe('move-in-direction handler', () => {
      const directions = ['forward', 'back', 'left', 'right'] as const;

      directions.forEach(direction => {
        it(`should move ${direction} for specified duration`, (done) => {
          const handler = ({ direction, duration = 1000 }: any) => {
            return new Promise((resolve) => {
              try {
                mockBot.setControlState(direction, true);

                setTimeout(() => {
                  mockBot.setControlState(direction, false);
                  resolve(createResponse(`Moved ${direction} for ${duration}ms`));
                }, 10); // Use short timeout for testing
              } catch (error) {
                mockBot.setControlState(direction, false);
                resolve(createErrorResponse(error as Error));
              }
            });
          };

          handler({ direction, duration: 10 }).then((result: any) => {
            expect(mockBot.setControlState).toHaveBeenCalledWith(direction, true);
            expect(mockBot.setControlState).toHaveBeenCalledWith(direction, false);
            expect(result.content[0].text).toBe(`Moved ${direction} for 10ms`);
            done();
          });
        });
      });

      it('should handle control state errors', (done) => {
        let errorThrown = false;
        mockBot.setControlState.mockImplementation(() => {
          if (!errorThrown) {
            errorThrown = true;
            throw new Error('Movement error');
          }
        });

        const handler = ({ direction, duration = 1000 }: any) => {
          return new Promise((resolve) => {
            try {
              mockBot.setControlState(direction, true);

              setTimeout(() => {
                mockBot.setControlState(direction, false);
                resolve(createResponse(`Moved ${direction} for ${duration}ms`));
              }, 10);
            } catch (error) {
              try {
                mockBot.setControlState(direction, false);
              } catch (e) {
                // Ignore secondary errors
              }
              resolve(createErrorResponse(error as Error));
            }
          });
        };

        handler({ direction: 'forward', duration: 10 }).then((result: any) => {
          expect(result.isError).toBe(true);
          expect(result.content[0].text).toBe('Failed: Movement error');
          done();
        }).catch(done);
      });
    });
  });

  describe('Inventory Tools', () => {
    describe('list-inventory handler', () => {
      it('should list all inventory items', async () => {
        const mockItems = [
          { name: 'stone', count: 64, slot: 0 },
          { name: 'dirt', count: 32, slot: 1 },
          { name: 'wood', count: 16, slot: 2 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);

        const handler = async (): Promise<any> => {
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

        expect(result.content[0].text).toContain('Found 3 items in inventory');
        expect(result.content[0].text).toContain('- stone (x64) in slot 0');
        expect(result.content[0].text).toContain('- dirt (x32) in slot 1');
        expect(result.content[0].text).toContain('- wood (x16) in slot 2');
      });

      it('should handle empty inventory', async () => {
        mockBot.inventory.items.mockReturnValue([]);

        const handler = async (): Promise<any> => {
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

        expect(result.content[0].text).toBe('Inventory is empty');
      });

      it('should handle inventory access errors', async () => {
        mockBot.inventory.items.mockImplementation(() => {
          throw new Error('Inventory access denied');
        });

        const handler = async (): Promise<any> => {
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

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Failed: Inventory access denied');
      });
    });

    describe('find-item handler', () => {
      it('should find existing item', async () => {
        const mockItems = [
          { name: 'iron_sword', count: 1, slot: 0 },
          { name: 'stone_pickaxe', count: 1, slot: 1 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);

        const handler = async ({ nameOrType }: any): Promise<any> => {
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

        const result = await handler({ nameOrType: 'sword' });

        expect(result.content[0].text).toBe('Found 1 iron_sword in inventory (slot 0)');
      });

      it('should handle item not found', async () => {
        mockBot.inventory.items.mockReturnValue([]);

        const handler = async ({ nameOrType }: any): Promise<any> => {
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

        const result = await handler({ nameOrType: 'diamond' });

        expect(result.content[0].text).toBe("Couldn't find any item matching 'diamond' in inventory");
      });

      it('should be case insensitive', async () => {
        const mockItems = [
          { name: 'iron_sword', count: 1, slot: 0 }  // lowercase name
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);

        const handler = async ({ nameOrType }: any): Promise<any> => {
          try {
            const items = mockBot.inventory.items();
            const item = items.find((item: any) =>
              item.name.toLowerCase().includes(nameOrType.toLowerCase())
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

        const result = await handler({ nameOrType: 'SWORD' });

        expect(result.content[0].text).toBe('Found 1 iron_sword in inventory (slot 0)');
      });
    });

    describe('equip-item handler', () => {
      it('should equip item to hand by default', async () => {
        const mockItems = [
          { name: 'iron_sword', count: 1, slot: 0 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);
        mockBot.equip.mockResolvedValue(undefined);

        const handler = async ({ itemName, destination = 'hand' }: any): Promise<any> => {
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

      it('should equip item to specified destination', async () => {
        const mockItems = [
          { name: 'iron_helmet', count: 1, slot: 0 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);
        mockBot.equip.mockResolvedValue(undefined);

        const handler = async ({ itemName, destination = 'hand' }: any): Promise<any> => {
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

        const result = await handler({ itemName: 'helmet', destination: 'head' });

        expect(mockBot.equip).toHaveBeenCalledWith(mockItems[0], 'head');
        expect(result.content[0].text).toBe('Equipped iron_helmet to head');
      });

      it('should handle equip errors', async () => {
        const mockItems = [
          { name: 'iron_sword', count: 1, slot: 0 }
        ];
        mockBot.inventory.items.mockReturnValue(mockItems);
        mockBot.equip.mockRejectedValue(new Error('Cannot equip item'));

        const handler = async ({ itemName, destination = 'hand' }: any): Promise<any> => {
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

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Failed: Cannot equip item');
      });
    });
  });

  describe('Chat Tools', () => {
    describe('send-chat handler', () => {
      it('should send chat message successfully', async () => {
        const handler = async ({ message }: any): Promise<any> => {
          try {
            mockBot.chat(message);
            return createResponse(`Sent message: "${message}"`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ message: 'Hello, world!' });

        expect(mockBot.chat).toHaveBeenCalledWith('Hello, world!');
        expect(result.content[0].text).toBe('Sent message: "Hello, world!"');
      });

      it('should handle empty messages', async () => {
        const handler = async ({ message }: any): Promise<any> => {
          try {
            mockBot.chat(message);
            return createResponse(`Sent message: "${message}"`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ message: '' });

        expect(mockBot.chat).toHaveBeenCalledWith('');
        expect(result.content[0].text).toBe('Sent message: ""');
      });

      it('should handle chat errors', async () => {
        mockBot.chat.mockImplementation(() => {
          throw new Error('Chat disabled');
        });

        const handler = async ({ message }: any): Promise<any> => {
          try {
            mockBot.chat(message);
            return createResponse(`Sent message: "${message}"`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler({ message: 'Hello' });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toBe('Failed: Chat disabled');
      });
    });
  });

  describe('Game State Tools', () => {
    describe('detect-gamemode handler', () => {
      it('should return current gamemode', async () => {
        mockBot.game.gameMode = 'creative';

        const handler = async (): Promise<any> => {
          try {
            return createResponse(`Bot gamemode: "${mockBot.game.gameMode}"`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler();

        expect(result.content[0].text).toBe('Bot gamemode: "creative"');
      });

      it('should handle missing game state', async () => {
        mockBot.game = undefined;

        const handler = async (): Promise<any> => {
          try {
            return createResponse(`Bot gamemode: "${mockBot.game.gameMode}"`);
          } catch (error) {
            return createErrorResponse(error as Error);
          }
        };

        const result = await handler();

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Failed:');
      });
    });
  });
});