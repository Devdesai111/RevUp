'use strict';

jest.mock('../../services/ai/ai.orchestrator');

const request  = require('supertest');
const app      = require('../../app');
const mongoose = require('mongoose');
const { callLLM } = require('../../services/ai/ai.orchestrator');

const EMAIL    = 'plan-test@example.com';
const PASSWORD = 'Password123!';

const MOCK_QUARTER_AI = {
  quarterTheme:    'Build With Discipline Every Day',
  macroObjectives: [
    {
      title:           'Launch MVP',
      pillar:          'career',
      successMetric:   'Product live with 10 users',
      monthlyBreakdown: ['Design & spec', 'Build core', 'Launch & iterate'],
    },
    {
      title:           'Improve fitness',
      pillar:          'health',
      successMetric:   'Run 5km without stopping',
      monthlyBreakdown: ['3x/wk runs', '5k build', 'Sub-30 5k'],
    },
  ],
};

let authToken;
let userId;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const setupSynthesizedIdentity = async (uid) => {
  const IdentityProfile = mongoose.model('IdentityProfile');
  await IdentityProfile.findOneAndUpdate(
    { userId: uid },
    {
      $set: {
        priorityPillars: ['career', 'health'],
        'currentIdentity.role':                 'Developer',
        'currentIdentity.energyLevel':           7,
        'currentIdentity.executionGapSeverity':  2,
        'futureIdentity.desiredRole':            'CTO',
        'futureIdentity.declarationSentence':    'I build with discipline.',
        'futureIdentity.skillGoals':             ['leadership', 'system design'],
        'riskProfile.stabilityScore':            60,
        'riskProfile.procrastinationIndex':      40,
        'riskProfile.driftProbability':          0.3,
        'timeConstraints.availableHoursPerDay':  8,
        'onboardingSteps.synthesized':           true,
        'onboardingSteps.currentIdentityDone':   true,
        'onboardingSteps.futureIdentityDone':    true,
        'onboardingSteps.constraintsDone':       true,
        'onboardingSteps.riskAssessmentDone':    true,
        'onboardingSteps.pillarsSelected':       true,
      },
    },
    { upsert: true, new: true },
  );
};

beforeEach(async () => {
  callLLM.mockResolvedValue(MOCK_QUARTER_AI);

  await request(app).post('/api/v1/auth/register').send({ email: EMAIL, password: PASSWORD });
  const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD });
  authToken = res.body.data.accessToken;
  userId    = res.body.data.user._id;

  await setupSynthesizedIdentity(userId);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/plan/quarter', () => {
  it('should generate a quarter plan with macroObjectives', async () => {
    const res = await request(app)
      .post('/api/v1/plan/quarter')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('quarterTheme');
    expect(res.body.data.macroObjectives).toHaveLength(2);
  });

  it('each objective should have title, pillar, successMetric, monthlyBreakdown', async () => {
    const res = await request(app)
      .post('/api/v1/plan/quarter')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    const obj = res.body.data.macroObjectives[0];
    expect(obj).toHaveProperty('title');
    expect(obj).toHaveProperty('pillar');
    expect(obj).toHaveProperty('successMetric');
    expect(obj.monthlyBreakdown).toHaveLength(3);
  });
});

describe('POST /api/v1/plan/month', () => {
  it('should generate month plan after quarter', async () => {
    await request(app).post('/api/v1/plan/quarter').set('Authorization', `Bearer ${authToken}`);
    const res = await request(app).post('/api/v1/plan/month').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.monthlyPlans.length).toBeGreaterThan(0);
  });
});

describe('POST /api/v1/plan/sprint', () => {
  it('should generate sprint with core + supporting tasks', async () => {
    await request(app).post('/api/v1/plan/quarter').set('Authorization', `Bearer ${authToken}`);
    await request(app).post('/api/v1/plan/month').set('Authorization', `Bearer ${authToken}`);
    const res = await request(app).post('/api/v1/plan/sprint').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.weeklySprints.length).toBeGreaterThan(0);
    const sprint = res.body.data.weeklySprints[0];
    expect(sprint.coreActions.length).toBe(3);
    expect(sprint.supportingActions.length).toBe(2);
  });
});

describe('GET /api/v1/plan/current', () => {
  it('should return the active plan after generation', async () => {
    await request(app).post('/api/v1/plan/quarter').set('Authorization', `Bearer ${authToken}`);
    const res = await request(app).get('/api/v1/plan/current').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('quarterTheme');
  });
});

describe('GET /api/v1/plan/stats', () => {
  it('should return totalCoreTasks and estimatedWeeklyHours', async () => {
    await request(app).post('/api/v1/plan/quarter').set('Authorization', `Bearer ${authToken}`);
    await request(app).post('/api/v1/plan/month').set('Authorization', `Bearer ${authToken}`);
    await request(app).post('/api/v1/plan/sprint').set('Authorization', `Bearer ${authToken}`);
    const res = await request(app).get('/api/v1/plan/stats').set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalCoreTasks');
    expect(res.body.data).toHaveProperty('estimatedWeeklyHours');
  });
});
