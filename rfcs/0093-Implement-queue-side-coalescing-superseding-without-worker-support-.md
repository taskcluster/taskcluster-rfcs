# RFC 93 - Implement queue-side coalescing (superseding without worker support)
* Comments: [#93](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/93)
* Initially Proposed by: @jonasfj

# Proposal
We extend tasks with:
```js
{
  stack: '<name>',  // requires scope: 'queue:stack:<name>'
  rank: 0, // integer task rank (higher means supersedes), defaults to zero
  ... // existing task fields
  payload: {...},
}
```

Tasks without `task.stack` will behave as if they were assigned an exclusive stack name.

`claimWork` will pick tasks by:
 1) Find the highest priority task (FIFO if there are multiple tasks with same priority)
 2) If another task with same `task.stack` and higher `task.rank` exists, it supersedes the task picked...

In-tree the decision task will use a per-branch string for `task.stack` if coalescing is supported, and `task.rank = push_log_id`, to ensure that newer pushes supersedes old pushes. 
Example: `task.stack = 'gecko:mozilla-central:<label>'` where `<label>` is the task-label.

Note: implementation of query logic like this requires a more advanced database like postgres.
