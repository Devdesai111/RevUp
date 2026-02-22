'use strict';

jest.mock('openai');

const { Errors } = require('../../utils/AppError');

describe('ai.orchestrator', () => {
  let callLLM;
  let OpenAI;

  beforeEach(() => {
    jest.resetModules();
    OpenAI = require('openai');
  });

  const loadOrchestrator = () => {
    callLLM = require('../../services/ai/ai.orchestrator').callLLM;
  };

  it('should return parsed JSON on successful LLM call', async () => {
    const payload = { foo: 'bar', score: 42 };
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: JSON.stringify(payload) } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }),
        },
      },
    }));
    loadOrchestrator();
    const result = await callLLM({ model: 'gpt-4o-mini', systemPrompt: 'sys', userPrompt: 'user' });
    expect(result).toEqual(payload);
  });

  it('should throw aiUnavailable after max retries on network error', async () => {
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('network error')),
        },
      },
    }));
    loadOrchestrator();
    await expect(
      callLLM({ model: 'gpt-4o-mini', systemPrompt: 'sys', userPrompt: 'user' }),
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });

  it('should throw aiUnavailable when response is not valid JSON', async () => {
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'not json at all' } }],
            usage: { prompt_tokens: 10, completion_tokens: 5 },
          }),
        },
      },
    }));
    loadOrchestrator();
    await expect(
      callLLM({ model: 'gpt-4o-mini', systemPrompt: 'sys', userPrompt: 'user' }),
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
});
