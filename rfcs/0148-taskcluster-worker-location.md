# RFC 148 - TASKCLUSTER_WORKER_LOCATION
* Comments: [#148](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/148)
* Proposed by: @djmitche

# Summary

This proposal defines an environment variable, `TASKCLUSTER_WORKER_LOCATION`, containing this information in an easily-digested format.

## Motivation

Workers often need information about where they are running, for example to select nearby mirrors or other resources.

Taskcluster does not currently provide this in a documented, supported fashion.

# Details

This proposes to introduce `$TASKCLUSTER_WORKER_LOCATION` as an environment variable available within tasks run by docker-worker and generic-worker.

The content has the format `<cloud>/<details>`.
The `<cloud>` portion will correspond to the provider types used within worker-manager (e.g., `google`, `amazon`).
The `<details>` portion is specific to the cloud.
Tasks not executed in any cloud (e.g., static or standalone workers) can define arbitrary locations.
Examples:
* `amazon/us-east-1b`
* `google/us-east1-c`
* `onprem/pdx1`

Workers will always supply a value in this variable, falling back to `unknown/unknown` if no value is known.

## Implementation Details

Taskcluster-worker-runner already posesses special-case code for each cloud, and makes queries to those clouds' metadata services.
As such, it is well-suited to determine the location in each cloud.

It will pass this information on to workers as a configuration option, and the workers will include it in the task environment.

## Documentation

The [taskcluster service docs on environment variables](https://docs.taskcluster.net/docs/manual/design/env-vars) already specify several variables that are available to tasks.
`TASKCLUSTER_WORKER_LOCATION` will be added to the list, with reference to tc-worker-runner's documentation for per-cloud definition of `<details>`.

# Credits

Thanks to @imbstack, @owlishDeveloper, and @walac for early discussion of this issue.

# Implementation Links

* [Bug 1572236](https://bugzilla.mozilla.org/show_bug.cgi?id=1572236)
