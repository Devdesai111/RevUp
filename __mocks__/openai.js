// CORRECTION C9: This file is at PROJECT ROOT (same level as package.json)
// Jest auto-discovers __mocks__/ at root level via moduleNameMapper in jest.config.js
// This ensures ZERO real OpenAI API calls are made in any test environment

const mockCreate = jest.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: JSON.stringify({
          behavioralRiskProfile: 'Test risk profile — high tendency to start without finishing.',
          quarterlyDirection: 'Focus on completing one core project before starting the next.',
          keyInsight: 'Your pattern of starting without finishing is your biggest identity gap.',
          suggestedDeclaration: 'I am becoming a disciplined executor who finishes what I start.',
        }),
      },
    },
  ],
  usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
});

const mockTranscribe = jest.fn().mockResolvedValue({ text: 'Test transcript from audio file.' });

const mockSpeech = jest.fn().mockResolvedValue({
  arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-audio-bytes')),
});

module.exports = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: mockCreate,
    },
  },
  audio: {
    transcriptions: {
      create: mockTranscribe,
    },
    speech: {
      create: mockSpeech,
    },
  },
}));
