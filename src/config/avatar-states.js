'use strict';

const AVATAR_STATES = {
  1: {
    name:        'Diminished',
    description: 'You are drifting from your identity. Time to realign.',
    visual: {
      posture:         'slumped',
      lighting:        'dim',
      lightingColor:   '#4A4A6A',
      aura:            'none',
      auraIntensity:   0,
      environment:     'grey',
      environmentHue:  '#2C2C3E',
      animation:       'static',
      breathingRate:   0,
      shadowIntensity: 0.8,
    },
    tone:    'firm',
    message: 'Your future self is waiting. Come back.',
  },
  2: {
    name:        'Stable',
    description: 'You are maintaining alignment. Keep building.',
    visual: {
      posture:         'neutral',
      lighting:        'warm',
      lightingColor:   '#E8C87A',
      aura:            'faint',
      auraIntensity:   0.3,
      auraColor:       '#A0A8FF',
      environment:     'normal',
      environmentHue:  '#3A3A5E',
      animation:       'breathing',
      breathingRate:   0.5,
      shadowIntensity: 0.4,
    },
    tone:    'neutral',
    message: 'Consistency compounds. Stay the course.',
  },
  3: {
    name:        'Aligned',
    description: 'You are becoming who you said you would be.',
    visual: {
      posture:         'upright',
      lighting:        'bright',
      lightingColor:   '#FFD700',
      aura:            'glow',
      auraIntensity:   1.0,
      auraColor:       '#6B8EFF',
      environment:     'elevated',
      environmentHue:  '#1A1A3E',
      animation:       'pulse',
      breathingRate:   1.0,
      shadowIntensity: 0.1,
    },
    tone:    'encouraging',
    message: "This is who you are becoming. Don't stop.",
  },
};

module.exports = AVATAR_STATES;
