import type { OnboardingAnswers, UserWeights } from './types';
import { DEFAULT_WEIGHTS } from './constants';

export function computeOnboardingWeights(answers: Partial<OnboardingAnswers>): UserWeights {
  const weights = { ...DEFAULT_WEIGHTS };

  if (answers.household) {
    switch (answers.household) {
      case 'solo':
      case 'couple':
        weights.school_culture = 0;
        break;
      case 'family_young':
        weights.school_culture += 4;
        weights.healthcare += 2;
        break;
      case 'family_teen':
        weights.school_culture += 3;
        break;
      case 'retiring':
        weights.healthcare += 3;
        weights.climate += 2;
        weights.safety += 2;
        break;
    }
  }

  if (answers.income) {
    switch (answers.income) {
      case 'remote':
        weights.purchasing_power += 3;
        break;
      case 'local_job':
        weights.purchasing_power += 2;
        weights.english_proficiency += 2;
        break;
      case 'pension':
        weights.purchasing_power += 1;
        weights.climate += 2;
        break;
    }
  }

  if (answers.civicImportance) {
    switch (answers.civicImportance) {
      case 'top_priority':
        weights.civic_culture += 4;
        break;
      case 'very_important':
        weights.civic_culture += 2;
        break;
      case 'nice_to_have':
      case 'not_important':
        break;
    }
  }

  if (answers.warmthImportance) {
    switch (answers.warmthImportance) {
      case 'essential':
        weights.warmth += 4;
        break;
      case 'matters':
        weights.warmth += 2;
        break;
      case 'not_priority':
        break;
    }
  }

  if (answers.climatePreference && answers.climatePreference !== 'no_preference') {
    weights.climate += 2;
  }

  if (answers.religiousNeeds) {
    switch (answers.religiousNeeds) {
      case 'important':
        weights.religious_freedom += 3;
        break;
      case 'not_priority':
        break;
    }
  }

  return weights;
}
