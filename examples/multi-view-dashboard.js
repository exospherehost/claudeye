/**
 * Example: Multiple Named Dashboard Views
 *
 * Shows how to organize dashboard filters into focused views.
 * Each view appears as a card at /dashboard and clicking one
 * navigates to /dashboard/[viewName] with that view's filters.
 *
 * Run with:
 *
 *   claudeye --evals ./examples/multi-view-dashboard.js
 */
import { createApp } from 'claudeye';

const app = createApp();

// ── Performance view ─────────────────────────────────────────────
// Metrics about session length and tool usage.
app.dashboard.view('performance', { label: 'Performance Metrics' })
  .filter('turn-count', ({ stats }) => stats.turnCount,
    { label: 'Turn Count' })
  .filter('tool-calls', ({ stats }) => stats.toolCallCount,
    { label: 'Tool Calls' })
  .filter('uses-subagents', ({ stats }) => stats.subagentCount > 0,
    { label: 'Uses Subagents' });

// ── Quality view ─────────────────────────────────────────────────
// Error and model analysis.
app.dashboard.view('quality', { label: 'Quality Checks' })
  .filter('has-errors', ({ entries }) =>
    entries.some(e =>
      e.type === 'assistant' &&
      Array.isArray(e.message?.content) &&
      e.message.content.some(b => b.type === 'tool_use' && b.is_error)
    ),
    { label: 'Has Errors' })
  .filter('primary-model', ({ stats }) => stats.models[0] || 'unknown',
    { label: 'Primary Model' });

// ── Backward-compatible default filter ───────────────────────────
// app.dashboard.filter() still works — goes to the "default" view.
// Default filters show below the view cards on /dashboard.
app.dashboard.filter('model', ({ stats }) => stats.models[0] || 'unknown',
  { label: 'Model' }
);

app.listen();
