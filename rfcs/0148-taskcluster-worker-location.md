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
The variable's value is a short chunk of JSON, with a top-level object.
If no location is available, workers will not set this variable.

That object must always have property `cloud`.
The remaining properties depend on the value of that property, but are fixed for each such value.
For example, if cloud is `amazon`, then a well-defined set of additional properties will always exist.

The precise structure for each cloud will be defined by the configuration for the workers.
In cases where worker startup is handled by `taskcluster-worker-runner`, it will be defined in that tool's documentation.

## Implementation

### Determining Location

Taskcluster-worker-runner already posesses special-case code for each cloud, and makes queries to those clouds' metadata services.
As such, it is well-suited to determine the location in each cloud.

It will pass this information on to workers as a configuration option, and the workers will include it in the task environment.

### Parsing

Since the value is in a JSON format, it is not easily used in a shell script.
Use of `grep` to parse the value is strongly discouraged.
The [`jq`](https://stedolan.github.io/jq/) utility can be useful, e.g., `echo $TASKCLUSTER_WORKER_LOCATION | jq -r .cloud`;

## Documentation

The [taskcluster service docs on environment variables](https://docs.taskcluster.net/docs/manual/design/env-vars) already specify several variables that are available to tasks.
`TASKCLUSTER_WORKER_LOCATION` will be added to the list, with reference to tc-worker-runner's documentation for per-cloud definition of `<details>`.

# Credits

Thanks to @imbstack, @owlishDeveloper, and @walac for early discussion of this issue.

# Implementation Links

* [Bug 1572236](https://bugzilla.mozilla.org/show_bug.cgi?id=1572236)
