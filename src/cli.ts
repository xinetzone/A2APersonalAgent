import { PersonalAgentEngine } from './agent/core/engine';
import { AgentCapability } from './protocol/a2a/message';
import { authClient } from './api/secondme/auth';
import { profileClient } from './api/secondme/profile';
import { memoryClient } from './api/secondme/memory';
import { credentialManager } from './api/secondme/credentials';

async function main() {
  console.log('=== A2A Personal Agent ===');
  console.log('Starting Personal Agent...');

  const agentId = process.env.AGENT_ID || `agent_${Date.now()}`;
  const capabilities: AgentCapability[] = ['memory', 'profile', 'matching', 'content', 'communication', 'discovery'];

  const engine = new PersonalAgentEngine({
    agentId,
    name: 'Personal Agent',
    description: 'A2A Personal Agent with memory and matching capabilities',
    capabilities,
  });

  try {
    await engine.start();
    console.log(`Agent ${agentId} started successfully`);
    console.log(`State: ${engine.getState()}`);

    const isAuth = await authClient.isAuthenticated();
    if (isAuth) {
      console.log('SecondMe authenticated');

      try {
        const profile = await profileClient.getProfile();
        console.log(`Profile: ${profile.name}`);
      } catch (e) {
        console.log('Profile fetch skipped or failed');
      }

      try {
        const memories = await memoryClient.searchMemories('test', 1, 5);
        console.log(`Found ${memories.total} memories`);
      } catch (e) {
        console.log('Memory search skipped or failed');
      }
    } else {
      console.log('Not authenticated - run login first');
    }

    console.log('\nAgent is ready. Press Ctrl+C to stop.');

    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await engine.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start agent:', error);
    process.exit(1);
  }
}

main();
