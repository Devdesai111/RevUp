'use strict';

const mongoose = require('mongoose');

describe('User Model', () => {
  let User;
  beforeAll(() => { User = require('../../models/User'); });

  it('should create a valid user', async () => {
    const user = new User({
      email: 'test@revup.app',
      authProvider: 'local',
      timezone: 'Asia/Kolkata',
    });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  it('should require email', () => {
    const user = new User({ authProvider: 'local' });
    const err = user.validateSync();
    expect(err.errors.email).toBeDefined();
  });

  it('should default subscriptionTier to free', () => {
    const user = new User({ email: 'a@b.com', authProvider: 'local' });
    expect(user.subscriptionTier).toBe('free');
  });

  it('should default isActive to true', () => {
    const user = new User({ email: 'a@b.com', authProvider: 'local' });
    expect(user.isActive).toBe(true);
  });

  it('toJSON should not expose passwordHash', () => {
    const user = new User({ email: 'a@b.com', authProvider: 'local', passwordHash: 'secret' });
    const json = user.toJSON();
    expect(json.passwordHash).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });

  it('should reject invalid authProvider', () => {
    const user = new User({ email: 'a@b.com', authProvider: 'facebook' });
    const err = user.validateSync();
    expect(err.errors.authProvider).toBeDefined();
  });
});

describe('IdentityProfile Model', () => {
  let IdentityProfile;
  beforeAll(() => { IdentityProfile = require('../../models/IdentityProfile'); });

  it('should require userId', () => {
    const ip = new IdentityProfile({});
    const err = ip.validateSync();
    expect(err.errors.userId).toBeDefined();
  });

  it('should enforce max 3 priorityPillars', () => {
    const ip = new IdentityProfile({
      userId: new mongoose.Types.ObjectId(),
      priorityPillars: ['health', 'wealth', 'relationships', 'career'],
    });
    const err = ip.validateSync();
    expect(err.errors.priorityPillars).toBeDefined();
  });

  it('should accept 3 or fewer priorityPillars', () => {
    const ip = new IdentityProfile({
      userId: new mongoose.Types.ObjectId(),
      priorityPillars: ['health', 'wealth'],
    });
    const err = ip.validateSync();
    expect(err).toBeUndefined();
  });
});

describe('Plan Model', () => {
  let Plan;
  beforeAll(() => { Plan = require('../../models/Plan'); });

  it('should require userId', () => {
    const plan = new Plan({});
    const err = plan.validateSync();
    expect(err.errors.userId).toBeDefined();
  });

  it('should default isActive to true', () => {
    const plan = new Plan({ userId: new mongoose.Types.ObjectId() });
    expect(plan.isActive).toBe(true);
  });

  it('should enforce max 3 coreActions in sprint', () => {
    const plan = new Plan({
      userId: new mongoose.Types.ObjectId(),
      weeklySprints: [{
        weekStartDate: new Date(),
        weekEndDate: new Date(),
        coreActions: [
          { name: 'a', weight: 1 },
          { name: 'b', weight: 1 },
          { name: 'c', weight: 1 },
          { name: 'd', weight: 1 },
        ],
      }],
    });
    const err = plan.validateSync();
    expect(err).toBeDefined();
  });
});

describe('DailyExecutionLog Model', () => {
  let DailyExecutionLog;
  beforeAll(() => { DailyExecutionLog = require('../../models/DailyExecutionLog'); });

  it('should require userId and date', () => {
    const log = new DailyExecutionLog({});
    const err = log.validateSync();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.date).toBeDefined();
  });

  it('should default isMissedDay to false', () => {
    const log = new DailyExecutionLog({
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
    });
    expect(log.isMissedDay).toBe(false);
  });
});

describe('AlignmentMetric Model', () => {
  let AlignmentMetric;
  beforeAll(() => { AlignmentMetric = require('../../models/AlignmentMetric'); });

  it('should require userId and date', () => {
    const m = new AlignmentMetric({});
    const err = m.validateSync();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.date).toBeDefined();
  });

  it('should enforce alignmentScore 0-100', () => {
    const m = new AlignmentMetric({
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      alignmentScore: 150,
    });
    const err = m.validateSync();
    expect(err.errors.alignmentScore).toBeDefined();
  });

  it('should enforce stateLevel enum 1|2|3', () => {
    const m = new AlignmentMetric({
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      stateLevel: 5,
    });
    const err = m.validateSync();
    expect(err.errors.stateLevel).toBeDefined();
  });
});

describe('JournalEntry Model', () => {
  let JournalEntry;
  beforeAll(() => { JournalEntry = require('../../models/JournalEntry'); });

  it('should require userId and date', () => {
    const j = new JournalEntry({});
    const err = j.validateSync();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.date).toBeDefined();
  });

  it('should enforce reflectionText min 10 chars', () => {
    const j = new JournalEntry({
      userId: new mongoose.Types.ObjectId(),
      date: new Date(),
      reflectionText: 'short',
    });
    const err = j.validateSync();
    expect(err.errors.reflectionText).toBeDefined();
  });

  it('should default processingStatus to pending', () => {
    const j = new JournalEntry({ userId: new mongoose.Types.ObjectId(), date: new Date() });
    expect(j.processingStatus).toBe('pending');
  });
});

describe('WeeklyReview Model', () => {
  let WeeklyReview;
  beforeAll(() => { WeeklyReview = require('../../models/WeeklyReview'); });

  it('should require userId and weekStartDate', () => {
    const wr = new WeeklyReview({});
    const err = wr.validateSync();
    expect(err.errors.userId).toBeDefined();
    expect(err.errors.weekStartDate).toBeDefined();
  });
});
