/** Error boundary for the dashboard page. */
"use client";
import ErrorFallback from "@/app/components/error-fallback";

export default function DashboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} heading="Dashboard Error" defaultMessage="An unexpected error occurred while loading the dashboard." />;
}
