# RFC 75 - Miscellaneous Workers
* Comments: [#75](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/75)
* Initially Proposed by: @djmitche


# Motivation

The Taskcluster team recommends use of dummy tasks for various purposes, and release engineering has also found them useful for various unusually-behaved tasks.

 * sending a message or being able to check when some subset of a task group is complete (e.g., all windows builds)
 * "faking out" production-only tasks when making development or staging task graphs (e.g., replace the balrog update task with `built-in/succeed`)

# Proposal

Taskcluster should supply a collection of special-cased workerTypes with
simple, predefined, useful behaviors, gathered under the `built-in` provisionerId [*].

* `built-in/succeed` -- When a task of this worker type is scheduled, it is
  immediately resolved as successful.

* `built-in/fail` -- When a task of this worker type is scheduled, it is
  immediately resolved as failed.

Scopes for these workerTypes would be given to `assume:repo:*`.  Since the tasks do not do anything interesting, store any potentially-compromisable state, or allow pending tasks, everyone can share the same workerTypes.

[*] this is treating provisionerId as something closer to "workerTypeGroup", since there is no provisioner service associated with this provisionerId.

## Implementation

The new workers would be implemented in a very simple, single-instance service called "taskcluster-built-in-workers" that simultaneously polls all of the given workerTypes.