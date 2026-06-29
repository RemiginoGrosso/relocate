import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-medium text-zinc-900">Page not found</h2>
        <p className="mt-2 text-sm text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
