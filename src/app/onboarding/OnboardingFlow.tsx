'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { ClimatePreference, OnboardingAnswers } from '@/lib/types';
import { computeOnboardingWeights } from '@/lib/weights';
import { useWeightStore } from '@/stores/useWeightStore';
import { useHydrated } from '@/components/shared/StoreHydration';
import { trackEvent } from '@/lib/analytics';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { QuestionStep } from '@/components/onboarding/QuestionStep';
import { WeightSummary } from '@/components/onboarding/WeightSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type AnswerKey = keyof OnboardingAnswers;

interface Question {
  key: AnswerKey;
  question: string;
  options: { label: string; value: string }[];
}

const QUESTIONS: Question[] = [
  {
    key: 'household',
    question: "What's your household situation?",
    options: [
      { label: 'Just me', value: 'solo' },
      { label: 'Couple', value: 'couple' },
      { label: 'Family with kids under 12', value: 'family_young' },
      { label: 'Family with kids 12–18', value: 'family_teen' },
      { label: 'Retiring', value: 'retiring' },
    ],
  },
  {
    key: 'income',
    question: "What's your income source?",
    options: [
      { label: 'Remote work or freelance', value: 'remote' },
      { label: 'Will look for a local job', value: 'local_job' },
      { label: 'Pension or savings', value: 'pension' },
    ],
  },
  {
    key: 'civicImportance',
    question:
      'How important is civic culture — rule of law, corruption control, and how safe the streets feel?',
    options: [
      { label: 'My top priority', value: 'top_priority' },
      { label: 'Very important', value: 'very_important' },
      { label: 'Nice to have', value: 'nice_to_have' },
      { label: 'Not important', value: 'not_important' },
    ],
  },
  {
    key: 'warmthImportance',
    question:
      'How important is warmth — friendly people, easy to make friends?',
    options: [
      { label: 'Essential', value: 'essential' },
      { label: 'It matters but I can be patient', value: 'matters' },
      { label: 'Not a priority', value: 'not_priority' },
    ],
  },
  {
    key: 'climatePreference',
    question: 'What kind of weather do you enjoy?',
    options: [
      { label: 'Warm & sunny', value: 'warm_sunny' },
      { label: 'Hot & tropical', value: 'hot_tropical' },
      { label: 'Mild & green', value: 'mild_green' },
      { label: 'Cold & crisp', value: 'cold_crisp' },
      { label: "I don't mind", value: 'no_preference' },
    ],
  },
  {
    key: 'religiousNeeds',
    question: 'Any religious community needs?',
    options: [
      { label: 'Yes, important to me', value: 'important' },
      { label: 'Not a priority', value: 'not_priority' },
    ],
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const { setAllWeights, setClimateType, resetToDefaults } = useWeightStore();
  const hydrated = useHydrated();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});

  const fromOnboarding = useWeightStore((s) => s.fromOnboarding);
  const showResumeBanner = hydrated && fromOnboarding;

  const showSummary = step >= QUESTIONS.length;
  const computedWeights = computeOnboardingWeights(answers);

  const handleResume = useCallback(() => {
    trackEvent('onboarding_resume', {});
    router.push('/ranking');
  }, [router]);

  const handleStartFresh = useCallback(() => {
    trackEvent('onboarding_start_fresh', {});
    resetToDefaults();
  }, [resetToDefaults]);

  const handleSelect = useCallback(
    (value: string) => {
      const q = QUESTIONS[step];
      setAnswers((prev) => ({ ...prev, [q.key]: value }));
      trackEvent('onboarding_answer', { question: q.key, answer: value, step: step + 1 });
      setTimeout(() => setStep((s) => s + 1), 200);
    },
    [step],
  );

  const handleSkip = useCallback(() => {
    trackEvent('onboarding_skip', { question: QUESTIONS[step].key, step: step + 1 });
    setStep((s) => s + 1);
  }, [step]);

  const handleContinue = useCallback(() => {
    trackEvent('onboarding_complete', { answers_count: Object.keys(answers).length });
    setAllWeights(computedWeights, true);
    if (answers.climatePreference) {
      setClimateType(answers.climatePreference as ClimatePreference);
    }
    router.push('/ranking');
  }, [computedWeights, answers, setAllWeights, setClimateType, router]);

  const handleAdjust = useCallback(() => {
    setAllWeights(computedWeights, true);
    if (answers.climatePreference) {
      setClimateType(answers.climatePreference as ClimatePreference);
    }
    router.push('/ranking');
  }, [computedWeights, answers.climatePreference, setAllWeights, setClimateType, router]);

  if (showResumeBanner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">You have saved priorities.</p>
              <h2 className="text-lg font-medium mb-6">Pick up where you left off?</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" onClick={handleResume}>
                  Continue with saved priorities
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleStartFresh}>
                  Start fresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {!showSummary && (
          <div className="mb-8">
            <ProgressBar current={step + 1} total={QUESTIONS.length} />
          </div>
        )}

        {showSummary ? (
          <WeightSummary
            weights={computedWeights}
            onContinue={handleContinue}
            onAdjust={handleAdjust}
          />
        ) : (
          <QuestionStep
            question={QUESTIONS[step].question}
            options={QUESTIONS[step].options}
            selected={answers[QUESTIONS[step].key] as string | undefined}
            onSelect={handleSelect}
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  );
}
