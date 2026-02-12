/** Error boundary for a named dashboard view. */
"use client";
import ErrorFallback from "@/app/components/error-fallback";

export default function ViewError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} heading="Dashboard View Error" defaultMessage="An unexpected error occurred while loading this dashboard view." />;
}
