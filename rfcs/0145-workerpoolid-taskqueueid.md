# RFC 0145 - Worker Pools and Task Queues
* Comments: [#0145](https://api.github.com/repos/taskcluster/taskcluster-rfcs/pulls/145)
* Proposed by: @djmitche

# Summary

We will replace the two-level identifier `<provisionerId>/<workerType>` with a single `<workerPoolId>` (when concerning pools of workers) and `<taskQueueId>` (when concering queues of tasks).
This will be done in such a way as to maintain backward compatibility for a suitable duration.

## Motivation

We have long had a "two-level" identifier space for worker types: `<provisionerId>/<workerType>`.
With the advent of worker-manager, there's no longer any significance to these levels, and the name `provisionerId` no longer has meaning as there are no longer any "provisioner" objects to be identified.

A few other aspects of this terminology have caused some confusion.
First, we have used "worker type" to mean several things:
 * The configuration for the pool in the AWS provisioner (e.g., `https://aws-provisioner.taskcluster.net/v1/worker-type/:worker-type`),
 * the pool of workers of that type (e.g., `https://queue.taskcluster.net/v1/provisioners/:provisionerId/worker-types/:workerType`), and
 * the queue containing tasks for that pool (e.g., `https://queue.taskcluster.net/v1/pending/:provisionerId/:workerType`).

We have also used the field name `workerType` to refer to a worker type, which differs from the rest of Taskcluster where identifier names end in `Id`.

This proposal outlines a low-impact way to address these sources of confusion as we transition to using worker-manager.

# Details

All worker-manager and related APIs will take a `workerPoolId` parameter to identify a pool of workers and the configuration and status of that pool.

All queue and task-related APIs will take a `taskQueueId` parameter to identify the queue containing the task.

Workers in a worker pool with identifier `workerPoolId` always and only claim tasks from a queue with `taskQueueId == workerPoolId`.
Thus the two concepts describe separate, but closely linked, concepts.

# Implementation

The transition from the current `<provisionerId>/<workerType>` design to `<workerPoolId>` will be done slowly, without any "flag day" changes and without breaking existing functionality in known deployments of Taskcluster.

For the duration of the transition, we will require that `workerPoolId` and `taskQueueId` contain a `/` with a typical Taskcluster identifier to the left of the `/` and a more restricted identifier to the right.
In detail, it must match `^[a-zA-Z0-9-_]{1,38}/[a-z]([-a-z0-9]{0,36}[a-z0-9])?$`.
This ensures that a `workerPoolId` or `taskQueueId` can be safely split into a `provisionerId` and `workerType` for communication with software that does not yet understand the new identifiers.

New software (such as worker-manager) will use `workerPoolId` and `taskQueueId` internally, translating to the older identifiers as necessary.
Old software can be gradually transitioned to use the new concepts internally, accepting both kinds of identifiers externally, and finally drop support for the old identifiers.

## API URLs

In many cases, API URLs have the form `../:provisionerId/:workerType`.
With some careful configuration of Express with regard to escaping of the `/` character, these API methods can be alterted to interpret the same URLs as containing a `workerPoolId` or `taskQueueId`.
This means that existing API clients can continue to operate in terms of `provisionerId` and `workerType` while calling the APIs that are defined in terms of `workerPoolId` or `taskQueueId`.

The `https://queue.taskcluster.net/v1/provisioners/:provisionerId/worker-types/:workerType` endpoint is an exception to this rule, as it contains the literal string `/worker-types/` in the middle of the URL.
However, this endpoint and its friends beginning with `/provisioners` are still experimental and soon will be replaced with worker-manager functionality, at which time they can be deprecated or removed.

EC2-Manager and AWS-Provisioner are also exceptions, but these services are deprecated and will be removed soon.

## Task Definitions

Task definitions currently contain `provisionerId` and `workerType` properties.
When the transition to this proposal is complete, these properties should be replaced with a single `taskQueueID`.

During the transition, however, the queue must both accomodate input from old and new clients, and produce output that new and old clients can interpret.
To do so, the `createTask` API method will accept a task definition with either `provisionerId` + `workerType` or `taskQueueId`, translating the former internally into a `taskQueueId`.
The `task` API method (which returns a task) will return task definitions containing all three fields, allowing interpretation by either old or new clients.

## Sunsetting the Old Identifiers

At some point, we would like to relax the requirements on the `workerPoolId` and `taskQueueId` identifiers -- in particular, to stop requiring `/`.

At that point, we can continue to accept tasks in the `createTask` API method containing `provisionerId` and `workerType`.
These are very likely to continue to exist, especially for small half-forgotten projects with no dedicated CI engineers.
For such tasks, queue can continue to synthesize a `taskQueueId` containing a `/` character, and so long as workers are still consuming from that queue, nothing will fail.

However, it will not be possible to determine a `provisionerId` and `workerType` for a `taskQueueId` that does not contain a `/`, so queue will stop returning task definitions containing these values.
This is a breaking API change, but only affects users that *read* task definitions: a smaller population than those who create tasks.
It is also a fairly simple change to ask those users to adapt to.

# Credits

Thanks to @imbstack and @owlish for discussion of this issue, to @owlish in particular for suggesting the identifier names, and to @petemoore for proposing the name `workerPoolId`.

# Implementation

* https://bugzilla.mozilla.org/show_bug.cgi?id=1560644
* https://bugzilla.mozilla.org/show_bug.cgi?id=1560645
* https://bugzilla.mozilla.org/show_bug.cgi?id=1560647

# Links

* [tools-taskcluster thread](https://groups.google.com/forum/#!topic/mozilla.tools.taskcluster/YT9gmBzAOws)
* [Worker-Manager API](https://docs.taskcluster.net/docs/reference/core/worker-manager/api)
