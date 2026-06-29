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
        weights.school_culture += 40;
        weights.healthcare += 15;
        break;
      case 'family_teen':
        weights.school_culture += 25;
        break;
      case 'retiring':
        weights.healthcare += 25;
        weights.climate += 20;
        weights.safety += 15;
        break;
    }
  }

  if (answers.income) {
    switch (answers.income) {
      case 'remote':
        weights.purchasing_power += 25;
        break;
      case 'local_job':
        weights.purchasing_power += 15;
        weights.english_proficiency += 20;
        break;
      case 'pension':
        weights.purchasing_power += 10;
        weights.climate += 15;
        break;
    }
  }

  if (answers.civicImportance) {
    switch (answers.civicImportance) {
      case 'top_priority':
        weights.civic_culture += 40;
        break;
      case 'very_important':
        weights.civic_culture += 20;
        break;
      case 'nice_to_have':
      case 'not_important':
        break;
    }
  }

  if (answers.warmthImportance) {
    switch (answers.warmthImportance) {
      case 'essential':
        weights.warmth += 35;
        break;
      case 'matters':
        weights.warmth += 15;
        break;
      case 'not_priority':
        break;
    }
  }

  if (answers.climatePreference) {
    switch (answers.climatePreference) {
      case 'warm_sunny':
      case 'hot_tropical':
        weights.climate += 20;
        break;
      case 'mild_green':
      case 'cold_crisp':
        weights.climate += 15;
        break;
      case 'no_preference':
        break;
    }
  }

  if (answers.religiousNeeds) {
    switch (answers.religiousNeeds) {
      case 'important':
        weights.religious_freedom += 25;
        break;
      case 'not_priority':
        break;
    }
  }

  return weights;
}
