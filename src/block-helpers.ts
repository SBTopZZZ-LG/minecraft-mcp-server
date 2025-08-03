import { Vec3 } from 'vec3';
import pathfinderPkg from 'mineflayer-pathfinder';

// Block placement types and interfaces
export interface FaceOption {
  direction: string;
  vector: Vec3;
}

export type FaceDirection = 'up' | 'down' | 'north' | 'south' | 'east' | 'west';

const { goals } = pathfinderPkg;

// Helper function to place a single block - extracted for testing
export async function placeSingleBlock(bot: any, x: number, y: number, z: number, faceDirection: FaceDirection = 'down'): Promise<{ success: boolean, message: string }> {
  try {
    const placePos = new Vec3(x, y, z);
    const blockAtPos = bot.blockAt(placePos);
    if (blockAtPos && blockAtPos.name !== 'air') {
      return { success: false, message: `There's already a block (${blockAtPos.name}) at (${x}, ${y}, ${z})` };
    }

    const possibleFaces: FaceOption[] = [
      { direction: 'down', vector: new Vec3(0, -1, 0) },
      { direction: 'north', vector: new Vec3(0, 0, -1) },
      { direction: 'south', vector: new Vec3(0, 0, 1) },
      { direction: 'east', vector: new Vec3(1, 0, 0) },
      { direction: 'west', vector: new Vec3(-1, 0, 0) },
      { direction: 'up', vector: new Vec3(0, 1, 0) }
    ];

    // Prioritize the requested face direction
    if (faceDirection !== 'down') {
      const specificFace = possibleFaces.find(face => face.direction === faceDirection);
      if (specificFace) {
        possibleFaces.unshift(possibleFaces.splice(possibleFaces.indexOf(specificFace), 1)[0]);
      }
    }

    // Try each potential face for placing
    for (const face of possibleFaces) {
      const referencePos = placePos.plus(face.vector);
      const referenceBlock = bot.blockAt(referencePos);

      if (referenceBlock && referenceBlock.name !== 'air') {
        if (!bot.canSeeBlock(referenceBlock)) {
          // Try to move closer to see the block
          const goal = new goals.GoalNear(referencePos.x, referencePos.y, referencePos.z, 2);
          await bot.pathfinder.goto(goal);
        }

        await bot.lookAt(placePos, true);

        try {
          await bot.placeBlock(referenceBlock, face.vector.scaled(-1));
          return { success: true, message: `Placed block at (${x}, ${y}, ${z}) using ${face.direction} face` };
        } catch (placeError) {
          console.error(`Failed to place using ${face.direction} face: ${(placeError as Error).message}`);
          continue;
        }
      }
    }

    return { success: false, message: `Failed to place block at (${x}, ${y}, ${z}): No suitable reference block found` };
  } catch (error) {
    return { success: false, message: `Error placing block at (${x}, ${y}, ${z}): ${(error as Error).message}` };
  }
}