import { NextRequest, NextResponse } from 'next/server';
import { getDailyGuidance, getTopicGuidance, listQuotes } from '@/dao/app';
import { SECONDME_API_BASE, STORAGE_PROVIDER } from '@/config';
import {
  createRoundTableSession,
  createCompanionSession,
  addJournalEntry,
  addMilestone,
  updateTrustLevel,
  generateDailyMessage,
  generateWeeklyReport,
  generateGreeting,
  createMoralCreditProfile,
  addDimensionEvidence,
  updateDimensionTrend,
  applyNaturalDecay,
  createMoralWallet,
  addMeritTransaction,
  makeDonation,
  useTrustQuota,
  updateTrustScore,
  upgradeLevel,
  getWalletSummary,
  getScenarios,
  processUserChoice,
  getTownCharacters,
  getCharacterById,
  getZoneInfo,
  getAllZones,
  getEnterQuote,
  getTownNarrative,
  createTownExperience,
  createInitialWorldState,
  getWastelandZones,
  canEnterWasteland,
  getEntryNarrative,
  getMeditationNarrative,
  getGuardianWisdom,
  getReturnQuote,
  createWastelandExperience,
  processWastelandMeditation,
} from '@/moral-life';
import {
  createStorage,
  getStorageManager,
  isCloudStorageAvailable,
  StorageManager,
} from '@/utils/storage/index';
import { FileStorage } from '@/utils/storage';

let storageManager: StorageManager | null = null;
let storageInitialized = false;

async function ensureStorageInitialized() {
  if (!storageInitialized) {
    if (STORAGE_PROVIDER === 'kv' || STORAGE_PROVIDER === 'postgres') {
      if (isCloudStorageAvailable()) {
        storageManager = await createStorage(STORAGE_PROVIDER);
      } else {
        console.warn(`Cloud storage provider "${STORAGE_PROVIDER}" configured but not available, falling back to file storage`);
        storageManager = await createStorage('file');
      }
    } else {
      storageManager = await createStorage('file');
    }
    storageInitialized = true;
  }
}

async function closeStorage() {
  if (storageManager) {
    await storageManager.close();
    storageManager = null;
  }
  storageInitialized = false;
}

function getCompanionStorageAdapter() {
  if (!storageManager) throw new Error('Storage not initialized');
  return storageManager.companionStorage;
}

function getMoralCreditStorageAdapter() {
  if (!storageManager) throw new Error('Storage not initialized');
  return storageManager.moralCreditStorage;
}

function getMoralWalletStorageAdapter() {
  if (!storageManager) throw new Error('Storage not initialized');
  return storageManager.moralWalletStorage;
}

function getWorldStateStorageAdapter() {
  if (!storageManager) throw new Error('Storage not initialized');
  return storageManager.worldStateStorage;
}

async function fetchWithToken(token: string, endpoint: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${SECONDME_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json() as { data: unknown };
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || (error.cause as { code?: string })?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        throw new Error(`无法连接到 ${new URL(url).hostname}，请检查网络连接后重试`);
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

const PUBLIC_TOOLS = ['moral_roundtable', 'dao_daily_guidance', 'dao_topic_guidance', 'dao_quotes_list'];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tool = searchParams.get('tool');
  const authHeader = request.headers.get('Authorization');

  let token = searchParams.get('token') || searchParams.get('access_token');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length);
  }

  if (!tool) {
    return NextResponse.json({ error: 'Missing tool parameter' }, { status: 400 });
  }

  const requiresAuth = !PUBLIC_TOOLS.includes(tool);
  if (requiresAuth && !token) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  try {
    let result: unknown;

    switch (tool) {
      case 'dao_daily_guidance': {
        const date = searchParams.get('date') || undefined;
        const topic = searchParams.get('topic') || undefined;
        const mood = searchParams.get('mood') || undefined;
        result = await getDailyGuidance({ date, topic, mood });
        break;
      }

      case 'dao_topic_guidance': {
        const topic = searchParams.get('topic') || '';
        const context = searchParams.get('context') || undefined;
        const mood = searchParams.get('mood') || undefined;
        result = await getTopicGuidance({ topic, context, mood });
        break;
      }

      case 'dao_quotes_list': {
        const theme = searchParams.get('theme') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        result = await listQuotes({ theme, limit });
        break;
      }

      case 'dao_save_daily_guidance_memory': {
        if (!token) {
          return NextResponse.json({ error: 'Token required for save memory' }, { status: 401 });
        }
        const date = searchParams.get('date') || undefined;
        const topic = searchParams.get('topic') || undefined;
        const mood = searchParams.get('mood') || undefined;
        const visibility = parseInt(searchParams.get('visibility') || '1', 10);

        const guidance = await getDailyGuidance({ date, topic, mood });
        const content = [
          `【今日箴言】${guidance.quote.title ? guidance.quote.title + '：' : ''}${guidance.quote.text}`,
          guidance.topic ? `主题：${guidance.topic}` : undefined,
          guidance.mood ? `情绪：${guidance.mood}` : undefined,
          `解读：${guidance.interpretation}`,
          `反思：${guidance.reflectionQuestions.map((q, i) => `${i + 1}. ${q}`).join(' ')}`,
          `行动：${guidance.practices.map((p, i) => `${i + 1}. ${p}`).join(' ')}`,
        ].filter(Boolean).join('\n');

        result = await fetchWithToken(token, '/memories/key', {
          method: 'POST',
          body: JSON.stringify({ mode: 'direct', content, visibility }),
        });
        break;
      }

      case 'get_profile': {
        if (!token) {
          return NextResponse.json({ error: 'Token required for get_profile' }, { status: 401 });
        }
        result = await fetchWithToken(token, '/api/secondme/user/info');
        break;
      }

      case 'search_memories': {
        if (!token) {
          return NextResponse.json({ error: 'Token required for search_memories' }, { status: 401 });
        }
        const keyword = searchParams.get('keyword') || '';
        const pageNo = searchParams.get('pageNo') || '1';
        const pageSize = searchParams.get('pageSize') || '20';
        result = await fetchWithToken(token, `/memories/key/search?keyword=${encodeURIComponent(keyword)}&pageNo=${pageNo}&pageSize=${pageSize}`);
        break;
      }

      case 'moral_roundtable': {
        const dilemma = searchParams.get('dilemma') || '';
        const agents = searchParams.get('agents')?.split(',') || ['daoist', 'confucian', 'philosopher'];
        const focus = searchParams.get('focus') || undefined;
        result = createRoundTableSession({ dilemma, agents: agents as any[], focus });
        break;
      }

      case 'moral_companion': {
        const action = searchParams.get('action') || '';
        const userId = searchParams.get('userId') || 'default-user';
        const companionId = searchParams.get('companionId') || 'daoist-brother';
        const sessionKey = `${userId}:${companionId}`;

        switch (action) {
          case 'get_session':
          case 'get_greeting':
          case 'get_weekly_report': {
            await ensureStorageInitialized();
            const companionStorage = getCompanionStorageAdapter();
            if (!await companionStorage.has(sessionKey)) {
              await companionStorage.set(sessionKey, createCompanionSession({ userId, companionId: companionId as any }));
            }
            if (action === 'get_greeting') {
              result = generateGreeting(companionId as any);
            } else if (action === 'get_weekly_report') {
              result = generateWeeklyReport(await companionStorage.get(sessionKey));
            } else {
              result = await companionStorage.get(sessionKey);
            }
            break;
          }
          case 'add_journal': {
            await ensureStorageInitialized();
            const companionStorage2 = getCompanionStorageAdapter();
            if (!await companionStorage2.has(sessionKey)) {
              await companionStorage2.set(sessionKey, createCompanionSession({ userId, companionId: companionId as any }));
            }
            const session = await companionStorage2.get(sessionKey);
            const content = searchParams.get('content') || '';
            const reflection = searchParams.get('reflection') || undefined;
            await companionStorage2.set(sessionKey, addJournalEntry(session, { content, reflection }));
            result = await companionStorage2.get(sessionKey);
            break;
          }
          case 'add_milestone': {
            await ensureStorageInitialized();
            const companionStorage3 = getCompanionStorageAdapter();
            if (!await companionStorage3.has(sessionKey)) {
              await companionStorage3.set(sessionKey, createCompanionSession({ userId, companionId: companionId as any }));
            }
            const session2 = await companionStorage3.get(sessionKey);
            const event = searchParams.get('event') || '';
            const insight = searchParams.get('insight') || '';
            await companionStorage3.set(sessionKey, addMilestone(session2, { event, insight }));
            result = await companionStorage3.get(sessionKey);
            break;
          }
          default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
        break;
      }

      case 'moral_credit': {
        const action = searchParams.get('action') || '';
        const userId = searchParams.get('userId') || 'default-user';
        const profileKey = `credit:${userId}`;

        switch (action) {
          case 'get_profile': {
            await ensureStorageInitialized();
            const moralCreditStorage = getMoralCreditStorageAdapter();
            if (!await moralCreditStorage.has(profileKey)) {
              await moralCreditStorage.set(profileKey, createMoralCreditProfile(userId));
            }
            result = await moralCreditStorage.get(profileKey);
            break;
          }
          case 'add_evidence': {
            await ensureStorageInitialized();
            const moralCreditStorage2 = getMoralCreditStorageAdapter();
            if (!await moralCreditStorage2.has(profileKey)) {
              await moralCreditStorage2.set(profileKey, createMoralCreditProfile(userId));
            }
            const profile = await moralCreditStorage2.get(profileKey);
            const dimension = searchParams.get('dimension') as any;
            const evidence = searchParams.get('evidence') || '';
            await moralCreditStorage2.set(profileKey, addDimensionEvidence(profile, dimension, evidence));
            result = await moralCreditStorage2.get(profileKey);
            break;
          }
          default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
        break;
      }

      case 'moral_training_camp': {
        const action = searchParams.get('action') || '';
        const scenarioType = searchParams.get('scenarioType') as any;
        const difficulty = searchParams.get('difficulty') as any;
        const theme = searchParams.get('theme') || undefined;

        switch (action) {
          case 'list_scenarios': {
            result = getScenarios({ type: scenarioType, difficulty, theme });
            break;
          }
          case 'submit_choice': {
            const scenarioId = searchParams.get('scenarioId') || '';
            const choiceId = searchParams.get('choiceId') || '';
            result = processUserChoice({ scenarioId, choiceId });
            break;
          }
          default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
        break;
      }

      case 'moral_wallet': {
        const action = searchParams.get('action') || '';
        const userId = searchParams.get('userId') || 'default-user';
        const walletKey = `wallet:${userId}`;

        switch (action) {
          case 'get_balance':
          case 'get_summary': {
            await ensureStorageInitialized();
            const moralWalletStorage = getMoralWalletStorageAdapter();
            if (!await moralWalletStorage.has(walletKey)) {
              result = { error: '钱包不存在，请先创建钱包' };
            } else {
              result = getWalletSummary(await moralWalletStorage.get(walletKey));
            }
            break;
          }
          case 'create_wallet': {
            await ensureStorageInitialized();
            const moralWalletStorage2 = getMoralWalletStorageAdapter();
            const name = searchParams.get('name') || '道德修行者';
            const wallet = createMoralWallet({ userId, name, level: '闻道' as any });
            await moralWalletStorage2.set(walletKey, wallet);
            result = wallet;
            break;
          }
          case 'earn_merit': {
            await ensureStorageInitialized();
            const moralWalletStorage3 = getMoralWalletStorageAdapter();
            if (!await moralWalletStorage3.has(walletKey)) {
              result = { error: '钱包不存在，请先创建钱包' };
            } else {
              const wallet = await moralWalletStorage3.get(walletKey);
              const source = searchParams.get('source') as any;
              const note = searchParams.get('note') || undefined;
              await moralWalletStorage3.set(walletKey, addMeritTransaction(wallet, { source, note }));
              result = getWalletSummary(await moralWalletStorage3.get(walletKey));
            }
            break;
          }
          default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
        break;
      }

      case 'daoist_town': {
        const action = searchParams.get('action') || '';
        const userId = searchParams.get('userId') || 'default-user';
        const stateKey = `world:${userId}`;

        switch (action) {
          case 'get_characters': {
            result = getTownCharacters();
            break;
          }
          case 'get_zones': {
            const zones = getAllZones().map(z => getZoneInfo(z as any));
            result = zones;
            break;
          }
          case 'get_narrative': {
            result = { narrative: getTownNarrative() };
            break;
          }
          case 'get_state': {
            await ensureStorageInitialized();
            const worldStateStorage = getWorldStateStorageAdapter();
            if (!await worldStateStorage.has(stateKey)) {
              await worldStateStorage.set(stateKey, createInitialWorldState(userId));
            }
            result = await worldStateStorage.get(stateKey);
            break;
          }
          case 'enter_zone': {
            await ensureStorageInitialized();
            const worldStateStorage2 = getWorldStateStorageAdapter();
            if (!await worldStateStorage2.has(stateKey)) {
              await worldStateStorage2.set(stateKey, createInitialWorldState(userId));
            }
            const zone = searchParams.get('zone') as any;
            const zoneInfo = getZoneInfo(zone);
            result = { state: { ...await worldStateStorage2.get(stateKey), currentZone: zone }, zoneInfo, enterQuote: getEnterQuote() };
            break;
          }
          default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
        break;
      }

      case 'wasteland': {
        const action = searchParams.get('action') || '';
        const userId = searchParams.get('userId') || 'default-user';
        const stateKey = `world:${userId}`;

        switch (action) {
          case 'get_zones': {
            result = getWastelandZones();
            break;
          }
          case 'can_enter': {
            await ensureStorageInitialized();
            const worldStateStorage = getWorldStateStorageAdapter();
            if (!await worldStateStorage.has(stateKey)) {
              await worldStateStorage.set(stateKey, createInitialWorldState(userId));
            }
            const state = await worldStateStorage.get(stateKey);
            const zone = searchParams.get('zone') as any;
            result = { canEnter: canEnterWasteland(state, zone), zone };
            break;
          }
          case 'enter': {
            await ensureStorageInitialized();
            const worldStateStorage2 = getWorldStateStorageAdapter();
            if (!await worldStateStorage2.has(stateKey)) {
              await worldStateStorage2.set(stateKey, createInitialWorldState(userId));
            }
            const state2 = await worldStateStorage2.get(stateKey);
            const zone = searchParams.get('zone') as any;
            if (!canEnterWasteland(state2, zone)) {
              result = { error: '境界不足，无法进入该区域' };
            } else {
              result = { narrative: getEntryNarrative(), returnQuote: getReturnQuote() };
            }
            break;
          }
          case 'meditate': {
            await ensureStorageInitialized();
            const worldStateStorage3 = getWorldStateStorageAdapter();
            if (!await worldStateStorage3.has(stateKey)) {
              await worldStateStorage3.set(stateKey, createInitialWorldState(userId));
            }
            const state3 = await worldStateStorage3.get(stateKey);
            const durationMinutes = parseInt(searchParams.get('durationMinutes') || '30', 10);
            const meditationResult = processWastelandMeditation(state3, durationMinutes);
            await worldStateStorage3.set(stateKey, meditationResult.newState);
            result = meditationResult;
            break;
          }
          case 'get_wisdom': {
            result = { wisdom: getGuardianWisdom(), meditation: getMeditationNarrative() };
            break;
          }
          default:
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }

    return NextResponse.json({
      jsonrpc: '2.0',
      id: 1,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result) }],
      },
    });
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json(
      { jsonrpc: '2.0', id: 1, error: { code: -32603, message: errorMessage } },
      { status: 500 }
    );
  }
}