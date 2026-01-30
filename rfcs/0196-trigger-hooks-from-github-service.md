# RFC 0196 - Trigger Hooks from Github Service
* Comments: [#196](https://github.com/taskcluster/taskcluster-rfcs/pull/196)
* Proposed by: @ahal

# Summary

In addition to scheduling tasks, the Github service will be able to trigger
hooks that are specified in a project's `.taskcluster.yml` file.

## Motivation

This will give instance administrators a way to provide "shared tasks" that
specific projects can opt into using without needing to copy / paste a large
blob of JSON-e.

Specifically in the Firefox-CI instance, it will allow us to define a single
well tested and maintained Decision task as a hook. This hides the complexity from
projects and ensures all projects are using the most recent and up-to-date
features.

# Details

A new `hooks` key will be added to the [taskcluster-yml-v1] schema. This key is
a list, where each item is an object containing `hookId` and optionally
additional `context`. Hook ID corresponds to an existing hook in the
Taskcluster instance, and `context` is a JSON serializable object that gets
forwarded as part of the payload in the [triggerHook] API, accessible under the
`context` namespace. Taskcluster Github will always implicitly include the
following in the payload:

- `event` - the raw Github event object
- `now` - the current time, as a string
- `taskcluster_root_url` - the root URL of the Taskcluster deployment
- `tasks_for` - the Github event type

For example:

```yml
version: 1
hooks:
  - hookId: decision/taskgraph
    context:
      trustDomain: mozilla
```

In this example, Taskcluster Github would make a call like:

```
triggerHook("decision", "taskgraph", {

  "context": {
    "trustDomain": "mozilla"
  },
  "event": <github event object>
  "now": <timestamp>,
  "taskcluster_root_url": "https://tc.example.com",
  "tasks_for": "github-push",
})
```

Hooks can then access the context via JSON-e:

```
$let:
  trustDomain: ${payload.context.trustDomain}
in:
  ...
```

## Permissions

Taskcluster Github will create a `hooks` client with scopes limited to the role
assumed earlier on based on the repository and Github event type. The role for
the current repo and context must have sufficient scopes to trigger the hook.
This works similarly to how Taskcluster Github currently calls the `createTask`
endpoint.

## Error Handling

If a `hookId` references a hook that does not exist, Taskcluster Github will
skip that hook and comment on the commit or pull request with an error message.

If the `triggerHook` call fails, i.e due to a failure rendering the hook's
JSON-e body or a scope error, then Taskcluster Github will skip that hook and
comment on the commit or pull request with details of the failure.

In both cases, Taskcluster Github will not abort and will proceed with firing any
remaining hooks or scheduling remaining tasks.

## Github Builds

The `triggerHook` API returns the hook task's `taskId` as part of the response.
Taskcluster Github will use this `taskId` to create a record in the Github
builds table. This will allow Taskcluster Github to add the task to Github's
checks UI and keep it updated with status changes.

This logic already exists for tasks scheduled based on the `tasks` key, so the
only new piece is obtaining the `taskId` from the `triggerHook` response rather
than parsing it out of the task definition.

## Edge Cases

If the `hooks` and `tasks` keys are both present in the `.taskcluster.yml`, the
hooks will be processed first, followed by the tasks.

If the hook's JSON-e template renders to `null`, then the hook service doesn't
create a task. In this case Taskcluster Github does not log any errors nor add
any records to the Github builds table.

# Implementation

<Once the RFC is decided, these links will provide readers a way to track the
implementation through to completion, and to know if they are running a new
enough version to take advantage of this change.  It's fine to update this
section using short PRs or pushing directly to master after the RFC is
decided>

* <link to tracker bug, issue, etc.>
* <...>
* Implemented in Taskcluster version ...

[taskcluster-yml-v1]: https://docs.taskcluster.net/docs/reference/integrations/github/taskcluster-yml-v1
[triggerHook]: https://docs.taskcluster.net/docs/reference/core/hooks/api#triggerHook
