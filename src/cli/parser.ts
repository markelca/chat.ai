import { Command } from 'commander';

export interface CliOptions {
  provider?: 'ollama' | 'openrouter';
  model?: string;
  session?: string;
}

export function parseArguments(): CliOptions {
  const program = new Command();

  program
    .name('ai-chat')
    .description('Terminal-based AI chat application supporting Ollama and OpenRouter')
    .version('1.0.0')
    .option('-p, --provider <provider>', 'AI provider to use (ollama or openrouter)')
    .option('-m, --model <model>', 'Model to use (overrides config default)')
    .option('-s, --session <name>', 'Session name to resume or create (overrides config)')
    .parse(process.argv);

  const options = program.opts<CliOptions>();

  if (options.provider && !['ollama', 'openrouter'].includes(options.provider)) {
    console.error('Error: --provider must be either "ollama" or "openrouter"');
    process.exit(1);
  }

  return options;
}
