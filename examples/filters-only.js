/**
 * Example: Minimal Dashboard View
 *
 * A minimal example showing a single named view with filters — no evals
 * or enrichments. Run with:
 *
 *   claudeye --evals ./examples/filters-only.js
 *
 * Then navigate to /dashboard to see the view, and click it to filter
 * across all your sessions.
 */
import { createApp } from 'claudeye';

const app = createApp();

app.dashboard.view('overview', { label: 'Session Overview' })
  .filter('model', ({ stats }) => stats.models[0] || 'unknown',
    { label: 'Model' })
  .filter('turns', ({ stats }) => stats.turnCount,
    { label: 'Turns' })
  .filter('used-tools', ({ stats }) => stats.toolCallCount > 0,
    { label: 'Used Tools' });

app.listen();
