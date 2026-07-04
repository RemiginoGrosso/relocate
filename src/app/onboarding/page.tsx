import type { Metadata } from 'next';
import OnboardingFlow from './OnboardingFlow';

export const metadata: Metadata = {
  title: 'Get started',
  description:
    'Answer 6 quick questions to discover which countries match your relocation priorities.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/onboarding' },
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
