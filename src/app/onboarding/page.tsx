'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingAnswers } from '@/lib/types';
import { computeOnboardingWeights } from '@/lib/weights';
import { useWeightStore } from '@/stores/useWeightStore';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { QuestionStep } from '@/components/onboarding/QuestionStep';
import { WeightSummary } from '@/components/onboarding/WeightSummary';

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
      'How important is civic culture — rule of law, social trust, respect for public space?',
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
    question: 'Climate preference?',
    options: [
      { label: 'Tropical', value: 'tropical' },
      { label: 'Mediterranean', value: 'mediterranean' },
      { label: 'Temperate', value: 'temperate' },
      { label: "I don't mind", value: 'dont_care' },
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

export default function OnboardingPage() {
  const router = useRouter();
  const { setAllWeights } = useWeightStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});

  const showSummary = step >= QUESTIONS.length;
  const computedWeights = computeOnboardingWeights(answers);

  const handleSelect = useCallback(
    (value: string) => {
      const q = QUESTIONS[step];
      setAnswers((prev) => ({ ...prev, [q.key]: value }));
      setTimeout(() => setStep((s) => s + 1), 200);
    },
    [step],
  );

  const handleSkip = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const handleContinue = useCallback(() => {
    setAllWeights(computedWeights, true);
    router.push('/ranking');
  }, [computedWeights, setAllWeights, router]);

  const handleAdjust = useCallback(() => {
    setAllWeights(computedWeights, true);
    router.push('/ranking');
  }, [computedWeights, setAllWeights, router]);

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
