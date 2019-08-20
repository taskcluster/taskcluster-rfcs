# RFC 58 - Add more `task.priority` levels
* Comments: [#58](https://github.com/taskcluster/taskcluster-rfcs/pull/58)
* Initially Proposed by: @jonasfj

# Proposal
Note: we currently have: `normal`, `high` (default is `normal`)

## Considerations:
 * We want to **use words for priority** (to avoid confusion like is 1 or 5 the highest priority?)
   * `lowest`, `low`, `normal`, `high`, `highest` (maybe later we add `very-low` and `very-high`)
 * We want **protect priority levels with scopes**

## Use cases:
 * Release tasks trumps all
 * Interactive loaner tasks are more important (a human definitely is waiting)
 * Retrigger tasks are often more important (a human might be waiting)
 * Improve responsiveness by allowing higher priority if `maxRunTime` is low (example below)

Imagine a workerType that is configured such that:
  * `task.priority = 'high'` and `maxRunTime > 5 min` => `malformed-payload` 
  * `task.priority = 'normal'` and `maxRunTime > 15 min` => `malformed-payload` 
  * `task.priority = 'low'` and `maxRunTime > 30 min` => `malformed-payload` 

For such a workerType you can submit you tasks with high priority if you are willing to set `maxRunTime` to less than 5 min. Hence, small fast tasks gets to run sooner than slow long tasks.
This improves system responsiveness, and is based on fact that people are willing to wait longer for long tasks. It also encourages quick smoke tests.

Note: we wouldn't want to configure all workerTypes as suggested above. But for some workerTypes it might make sense to prioritize responsiveness.

## Issues for discussion:
 * What should name the priority levels?
 * What should the default priority level be? currently `normal`, maybe it should be `lowest`?
 * How do we protect with scopes? currently we require `queue:priority:<priority>`, but this not good.
   * It's inconsistent because `normal` doesn't require any scope (as it's the default)
   * Note: we could grant `queue:priority:<default>` to all clients/roles who can create tasks
   * (this wouldn't solve cases where people use `authorizedScopes` or temporary credentials, but breakage cold be limited)
   * We probably want scopes for each priority level for each provisionerId/workerType...
     * `queue:priority:<provisionerId>/<workerType>/<priority>` is rather ugly?
     * Or do we need to rethink auth, such that clients not just defines a set of scopes, but a set of scope-sets, such that not all your scopes can be used together...
