# RFC 0163 - ProjectId
* Comments: [#0163](https://github.com/taskcluster/taskcluster-rfcs/pull/163)
* Proposed by: @djmitche

# Summary

Taskcluster users typically want to be able to manipulate their tasks after they are created (cancel, rerun, etc.).
Experience shows that `schedulerId` is not suitable for this purpose (see below for details).
This RFC proposes a new task property, `projectId`, identifying the project to which a task corresponds.
This aligns nicely with the conventional definition of a "project" as a portion of identifiers such as `roleId` and `hookGroupId`.
It also introduces new scopes based on this property that control API methods such as `cancelTask` and `rerunTask`.

## Motivation

Taskcluster users would like to be able to manipulate tasks after they are created, but would prefer that other users *not* be allowed to perform such manipulations.
At present, Taskcluster lacks an effective mechanism for doing so.

### Use Cases

1. Administration of the `exciting-app` project is delegated to `github-team:excitement/core`.
   Members of this team would like to be able to rerun tasks that fail due to infrastructure or intermittent issues, using the Taskcluster UI, but would like to prevent members of other projects from doing so.

2. Similar to above, but exciting-app administrators would like to allow `github-team:excitement/contributors` to rerun test tasks, but not rerun deployment-related tasks nor cancel anything.

3. The `exciting-app` project has several repos, each with a different set of developers.
   They would like to allow each set of developers to manipulate tasks for their repo, without allowing everyone access to all tasks.

4. Several mutually-trusting projects share a worker pool to reduce overhead.
   The accounting department would like to determine the cost for compute resources for each of those projects, by assigning the compute time for each task to the tasks's project.

### What about SchedulerId?

The `schedulerId` property currently appears in scopes related to task manipulation, making it an seem like a good choice for controlling access to such actions.
However, the property is overridden with several other meanings that tend to interfere:

* it can represent the entity that created the task;
* it can limit addition of new tasks to a task group: all tasks in task group must have the same `schedulerId`; and
* it appears in pulse message routes and can be used to filter messages.

The first and last points are currently in use by the GitHub srevice, which sets `schedulerId` on tasks it creates and uses its presence in Pulse routes to identify activity on those tasks.

The second point could conflict with task manipulation in some use-cases.
For example, a task-group created in response to a pull request might contain a mix of test tasks and tasks to do a staging deployment.
Since all tasks in a task group must share the same `schedulerId`, the property would not support use-case 2, above, where tasks are differentiated within the same task-group.

Finally, as a component in a pulse route, `schedulerId` is limited to 38 characters.
While this is generally adequate for a single identifier, use cases 2 and 3 can both be addressed with slash-separated identifiers like `exciting-app/repo-a/test`, and such identifiers will quickly outgrow a 38-character limit.

### Why Only Tasks?

The fourth use-case, regarding accounting, might wish to determine costs for other Taskcluster resources.
The costly resources in a Taskcluster deployment are artifact storage and compute time.
This RFC would permit accounting for storage, since it assigns a `projectId` to each task, and artifacts are associated with tasks.
It also permits allocation of active compute time to projects as described in the use-case itself.
However, it does not address worker overhead -- setup time and idle time.
Why not include `projectId` as a top-level property of worker pools?

The reasoning is that worker pools have user-supplied names which can include a projectId as a substring, e.g., `project-exciting-app/linux-ci`, and use of worker pools is constrained by scopes.
Tasks have only random identifiers (`taskIds`), and thus require a separate field to identify the associated project.

# Details

## Tasks

Tasks will have a new top-level property, `projectId`, of unlimited length.
The property will appear in task definitions returned from various API methods, like any other property of a task.
The property does not automatically appear in Pulse routes.

## Scopes and API Methods

### Creation

The Queue service's `createTask` API method will require the scope `queue:create-task:project:<projectId>` in addition to the current set of scopes.

### Manipulation

The Queue service's `cancelTask`, `scheduleTask`, and `rerunTask` API methods currently require `queue:<method-name>:<schedulerId>/<taskGroupId>/<taskId>` or a legacy scope set.
In this RFC, a third alternative would be added, `queue:<method-name>-in-project:<projectId>`, such that the action will be permitted if either scope is present.

The naming of this scope is unfortunate, but required to disambiguate it from the existing scopes.
The simpler scope pattern `queue:<method-name>:<projectId>` would give new permissions to credentials with existing `schedulerId`-based scopes.
For example, would `queue:cancel-task:taskcluster-ui/*` refer to tasks with `schedulerId` `taskcluster-ui` or to tasks with a `projectId` matching `taskcluster-ui/*`?

## Compatibility

To support the transition from the current situation to one where every task has a `projectId`, this RFC adds a distinguished identifier, `none`
On upgrade to the version of Taskcluster supporting `projectId`, every existing task will be given `projectId` `none`.
Calls to `createTask` that omit a `projectId` will create a task with `projectId` `none`, in which case the scope `queue:create-task:project:none` is *not* required.
Calling `createTask` with `projectId` explicitly set to `none` *will* require the scope.

This allows existing code to continue operating after the upgrade.
Calls to `createTask` without a `projectId` will be considered deprecated and support may be removed entirely one year after this change is released.

No changes to the manipulation methods are required for compatibility.

# Open Questions

## Must `createTask` Be Scope-Restricted?

If the proposed restrictions on `createTask` described above were removed, the result would be that anyone can create a task in any project.
The effect, in terms of threat analysis, is that Mallory can create a task which Alice can cancel or rerun.
That's not awful, and might be a reasonable price to pay to avoid the additional complexity of `createTask`'s scope requirements and the unique `none` `projectId`.
However, it would affect accounting in the fourth use-case: Mallory's task would be "billed" to Alice's project.

# Implementation

TBD
<!--
<Once the RFC is decided, these links will provide readers a way to track the
implementation through to completion, and to know if they are running a new
enough version to take advantage of this change.  It's fine to update this
section using short PRs or pushing directly to master after the RFC is
decided>

* <link to tracker bug, issue, etc.>
* <...>
* Implemented in Taskcluster version ...
-->
