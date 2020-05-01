# RFC 159 - Private Task Logs
* Comments: [Bug 1598698](https://bugzilla.mozilla.org/show_bug.cgi?id=1598689), [#159](https://github.com/taskcluster/taskcluster-rfcs/pull/159)
* Proposed by: @djmitche

# Summary

A task's log output is currently world-readable.
Tasks that wish to keep their output private must carefully divert output from stdout/stderr into other files and upload those files as artifacts.

This RFC proposes making this behavior optional, with private logs as an alternative.
Such logs would require credentials with specific scopes to read.

## Motivation

Even in open-source development, secrecy can be important.
For example, CI for fixes to security issues can reveal those security issues if logs are public.

Private-log capability is also a common request from outside parties interested in deploying Taskcluster.

# Details

## Current Log Implementation

The current [convention](https://docs.taskcluster.net/docs/manual/design/conventions/task-logs) is to name the main task log `public/logs/live.log`, and that fetching this artifact may -- if the worker supports it -- result in receiving log lines as they are produced.

The Taskcluster UI, and other consumers of task logs such as Treeherder, incorporate this convention and look for logs at that artifact name.

Workers that cannot do "live logging" simply create an S3 artifact with this name.
Workers that *can* do live logging use the following process.
At the beginning of the task, they create a Reference artifact named `public/logs/live.log` containing a URL that will connect to the worker (usually via [Websocktunnel](https://github.com/taskcluster/taskcluster/tree/master/tools/websocktunnel#readme)) to get log lines as they are produced.
When the task is complete, they create a new S3 artifact containing the whole log, named `public/logs/live_backing.log`.
They then modify the URL in the `public/logs/live.log` artifact (using a [special case in the `createTask` API](https://docs.taskcluster.net/docs/reference/platform/queue/api#createArtifact)) to point to the URL for the `getArtifact` method for the `public/logs/live_backing.log` artifact (`<rootUrl>/api/queue/v1/task/<taskId>/runs/<runId>/artifacts/public/logs/live_backing.log`).

Reference artifacts correspond to HTTP 303 redirects, and HTTP clients do not re-authenticate when following a redirect.
So the fetch of `live_backing.log` is performed without Taskcluster credentials, even if the initial call to `getArtifact` used credentials.
If `live_backing.log` is always public, this is not a problem, but if it is private then this may result in additional complexity for clients wishing to access task logs.

## New Log Implementation

The updated convention is, briefly, to make the artifact name containing logs configurable on a per-task basis, so that users may choose a `public/` or non-public name; and to introduce a new artifact type that will avoid the issues around authentication and redirects.

The convention for task-related conventions is to put information in `task.extra`, using sub-objects to group related configuration.
In the new design, the log artifact name is found at `task.extra.logs.taskLogArtifact`, with a default value of `public/logs/live.log` for compatibility.
Workers will be modified to optionally look for an artifact name somewhere under `task.payload`, defaulting to the value in `task.extra.logs.taskLogArtifact` and applying that field's default if necessary.
They will use the result as the name for the task log artifact.

UIs and other log consumers will be modified to consult `task.extra.logs.taskLogArtifact`, applying its default, before fetching task logs.

To support live logging, a new queue artifact type, "LiveLog", is added.
This type is similar to the existing Reference type, in that it contains a URL to which it redirects.
However, its URL cannot be modified, but it can be replaced with an artifact of another type.

Workers create a LiveLog artifact when a task begins, and replace that with a "normal" artifact (such as S3) when the task completes.
The URL in the LiveLog artifact should contain enough entropy that it cannot be guessed, preventing anyone who cannot read the LiveLog artifact from connecting to the worker to download logs.

# Implementation

The following changes will be required (this section will be updated with progress):

 * Documentation for new convention
 * Implementation of new LiveLog artifact type in queue
 * Implementation of `task.extra.logs.taskLogArtifact`, fetching logs with credentials in Taskcluster UI
 * Implementation of updated log handling in workers
   * Generic-Worker
   * Docker-Worker
   * Scriptworker
 * Implementation in other log consumers; known consumers:
   * Treeherder (NOTE: Treeherder currently fetches `public/logs/live_backing.log` directly)
