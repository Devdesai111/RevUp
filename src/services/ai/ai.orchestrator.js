'use strict';

const OpenAI = require('openai');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { Errors } = require('../../utils/AppError');

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * callLLM — wraps OpenAI chat completion with retry + JSON enforcement.
 * @param {{ model: string, systemPrompt: string, userPrompt: string, maxTokens?: number }}
 * @returns {Promise<object>} Parsed JSON from the model response
 * @throws {AppError} Errors.aiUnavailable() after all retries exhausted
 */
const callLLM = async ({ model, systemPrompt, userPrompt, maxTokens = 1000 }) => {
  const maxRetries = env.OPENAI_MAX_RETRIES;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      const usage   = response.usage;

      logger.info({
        model,
        promptTokens:     usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      }, 'LLM call succeeded');

      const parsed = JSON.parse(content);
      return parsed;

    } catch (err) {
      lastError = err;
      const isParseError = err instanceof SyntaxError;
      const isLast       = attempt === maxRetries;

      if (isLast) { break; }

      // Don't retry parse errors — the model returned non-JSON
      if (isParseError) { break; }

      const delay = 200 * Math.pow(2, attempt); // 200ms, 400ms, 800ms …
      logger.warn({ attempt, delay, err: err.message }, 'LLM call failed, retrying');
      await sleep(delay);
    }
  }

  logger.error({ err: lastError?.message }, 'LLM call failed after all retries');
  throw Errors.aiUnavailable();
};

module.exports = { callLLM };
