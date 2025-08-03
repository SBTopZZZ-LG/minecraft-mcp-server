import { Vec3 } from 'vec3';
import { placeSingleBlock, FaceDirection } from '../src/block-helpers';
import { createMockBot } from './test-utils';

// Mock mineflayer-pathfinder
jest.mock('mineflayer-pathfinder', () => ({
  pathfinder: {},
  Movements: jest.fn(),
  goals: {
    GoalNear: jest.fn()
  }
}));

describe('Block Helpers', () => {
  describe('placeSingleBlock', () => {
    let mockBot: any;
    let mockGoalNear: jest.MockedClass<any>;

    beforeEach(() => {
      mockBot = createMockBot();
      mockGoalNear = require('mineflayer-pathfinder').goals.GoalNear;
      jest.clearAllMocks();
    });

    it('should return error if block already exists at position', async () => {
      // Mock a block already exists
      mockBot.blockAt.mockReturnValue({ name: 'stone', type: 1 });

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(false);
      expect(result.message).toBe("There's already a block (stone) at (1, 2, 3)");
    });

    it('should successfully place block when reference block is available', async () => {
      // Mock air at target position
      mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
      // Mock reference block exists
      mockBot.blockAt.mockReturnValueOnce({ name: 'dirt', type: 3 });
      mockBot.canSeeBlock.mockReturnValue(true);
      mockBot.placeBlock.mockResolvedValue(undefined);

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Placed block at (1, 2, 3) using down face');
      expect(mockBot.lookAt).toHaveBeenCalledWith(new Vec3(1, 2, 3), true);
      expect(mockBot.placeBlock).toHaveBeenCalled();
    });

    it('should try to move closer if cannot see reference block', async () => {
      // Mock air at target position
      mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
      // Mock reference block exists but cannot see it initially
      mockBot.blockAt.mockReturnValueOnce({ name: 'dirt', type: 3 });
      mockBot.canSeeBlock.mockReturnValue(false);
      mockBot.placeBlock.mockResolvedValue(undefined);

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(true);
      expect(mockGoalNear).toHaveBeenCalledWith(1, 1, 3, 2); // reference position
      expect(mockBot.pathfinder.goto).toHaveBeenCalled();
    });

    it('should try different faces if first face fails', async () => {
      // Mock air at target position
      mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
      // Mock no reference block for down face (first attempt)
      mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
      // Mock reference block exists for north face (second attempt)
      mockBot.blockAt.mockReturnValueOnce({ name: 'stone', type: 1 });
      mockBot.canSeeBlock.mockReturnValue(true);
      mockBot.placeBlock.mockResolvedValue(undefined);

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Placed block at (1, 2, 3) using north face');
    });

    it('should use specified face direction as priority', async () => {
      // Mock air at target position
      mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
      // Mock reference block exists for specified face
      mockBot.blockAt.mockReturnValueOnce({ name: 'stone', type: 1 });
      mockBot.canSeeBlock.mockReturnValue(true);
      mockBot.placeBlock.mockResolvedValue(undefined);

      const result = await placeSingleBlock(mockBot, 1, 2, 3, 'north');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Placed block at (1, 2, 3) using north face');
    });

    it('should return error if no suitable reference block found', async () => {
      // Mock air at target position
      mockBot.blockAt.mockReturnValue({ name: 'air', type: 0 });

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to place block at (1, 2, 3): No suitable reference block found');
    });

    it('should handle placeBlock errors gracefully', async () => {
      // Mock air at target position
      mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
      // Mock reference block exists
      mockBot.blockAt.mockReturnValueOnce({ name: 'dirt', type: 3 });
      mockBot.canSeeBlock.mockReturnValue(true);
      mockBot.placeBlock.mockRejectedValue(new Error('Cannot place block'));

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to place block at (1, 2, 3): No suitable reference block found');
    });

    it('should handle pathfinder errors gracefully', async () => {
      // Mock air at target position
      mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
      // Mock reference block exists but cannot see it
      mockBot.blockAt.mockReturnValueOnce({ name: 'dirt', type: 3 });
      mockBot.canSeeBlock.mockReturnValue(false);
      mockBot.pathfinder.goto.mockRejectedValue(new Error('Cannot reach target'));

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error placing block at (1, 2, 3): Cannot reach target');
    });

    it('should handle unexpected errors', async () => {
      // Mock blockAt to throw an error
      mockBot.blockAt.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await placeSingleBlock(mockBot, 1, 2, 3);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error placing block at (1, 2, 3): Unexpected error');
    });

    // Test all face directions
    const faceDirections: FaceDirection[] = ['up', 'down', 'north', 'south', 'east', 'west'];
    
    faceDirections.forEach(direction => {
      it(`should handle ${direction} face direction`, async () => {
        // Mock air at target position
        mockBot.blockAt.mockReturnValueOnce({ name: 'air', type: 0 });
        // Mock reference block exists
        mockBot.blockAt.mockReturnValueOnce({ name: 'stone', type: 1 });
        mockBot.canSeeBlock.mockReturnValue(true);
        mockBot.placeBlock.mockResolvedValue(undefined);

        const result = await placeSingleBlock(mockBot, 1, 2, 3, direction);

        expect(result.success).toBe(true);
        expect(result.message).toBe(`Placed block at (1, 2, 3) using ${direction} face`);
      });
    });
  });
});