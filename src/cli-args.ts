import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface BotOptions {
  host: string;
  port: number;
  username: string;
}

export function parseCommandLineArgs(): BotOptions {
  return yargs(hideBin(process.argv))
    .option('host', {
      type: 'string',
      description: 'Minecraft server host',
      default: 'localhost'
    })
    .option('port', {
      type: 'number',
      description: 'Minecraft server port',
      default: 25565
    })
    .option('username', {
      type: 'string',
      description: 'Bot username',
      default: 'LLMBot'
    })
    .help()
    .alias('help', 'h')
    .parseSync() as BotOptions;
}