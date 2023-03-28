# RFC 182 - Allow remote references to .taskcluster.yml files processed by Taskcluster-GitHub
* Comments: [#182](https://github.com/taskcluster/taskcluster-rfcs/pull/182)
* Proposed by: @bhearsum

# Summary

Allow `.taskcluster.yml` files in GitHub repositories to outsource most of their contents to a `.taskcluster.yml` stored elsewhere.

## Motivation

`.taskcluster.yml` files in GitHub repositories are responsible for creating tasks (or not) in response to various GitHub events. In some cases (eg: when a decision task is used to delegate most of this to a separate tool), these files end up looking almost entirely identical, and hundreds of lines of JSON-e ends up duplicated across many different repositories. This duplication is a significant maintenance burden, and easily results in unwanted differences.

Allowing a `.taskcluster.yml` to reference a file stored elsewhere will allow for deduplication of the bulk of the content in these files, resolving the concerns noted above.

# Details

Two new variables will be introduced to `.taskcluster.yml` files. The first, `config-from`, will allow a reference to a different GitHub repository to be provided that points at a full-fledged `.taskcluster.yml` hosted elsewhere. This reference may be pinned to a specific revision, or to a tag or branch name. The second, `context`, will allow for variables to be defined that will be included with the JSON-e context when the referenced `.taskcluster.yml` is rendered. Here is an example of a possible concrete `.taskcluster.yml`:

```
---
version: 1
config-from: github.com/taskcluster/taskgraph/data/taskcluster-yml-github.yml@main
context:
  project-name: mozillavpn
  scopes:
    - secrets:get:project/mozillavpn/*
```

When `config-from` is present in the `.taskcluster.yml`, the existing `tasks` top level key is not valid (they are mutually exclusive). Other top level keys, such as `policy` and `reporting` continue to be valid. If these keys are present in both the `config-from` `.taskcluster.yml` and the project repository `.taskcluster.yml`, the value in the latter will take precedence.

The new `context` key is optional, and only permitted when `config-from` is present.

In addition to the extra `context` that project repos may define (above), Taskcluster-GitHub will provide the following context as well:
* `taskclusterYmlRepo` will be the full URL to the repo that contains the final `.taskcluster.yml`. In cases where `config-from` is not present this will be the URL of the project repository. In cases where it is present, it will be the reposisitory part of the `config-from` repository, as an `https` URL.
* `taskclusterYmlRevision` will be the revision in the `taskclusterYmlRepo` of the `.taskcluster.yml` rendered by Taskcluster-GitHub. In cases where `config-from` is set, and a tag or branch reference has been used, it will be deferenced to a revision.

This additional context is intended to allow tasks defined in `.taskcluster.yml` to republish as metadata, but it may have future uses as well.

## Top level key precedence

This change introduces two new top level keys, and introduces two possible sources for some existing ones. Here is a summary of what is allowed where, and the order of precedence for keys that are allowed in both places:
| Key               | Permitted in project repo? | Permitted in referenced .taskcluster.yml? | Precedence?      |
|-------------------|----------------------------|-------------------------------------------|------------------|
| tasks             | Y                          | Y                                         | N/A(\*)          |
| policy            | Y                          | Y                                         | project repo     |
| reporting         | Y                          | Y                                         | project repo     |
| config-from       | Y                          | N                                         | N/A              |
| context           | Y                          | N                                         | N/A              |

(\*) In addition to the above rules, `tasks` and `config-from` are mutually exclusive: you must specify one or the other in a project repository `.taskcluster.yml`, but not both.

## Building context for rendering

With the introduction of additional sources for context, it's worth making explicit the order of precedence they have, which is:
1) GitHub & Taskcluster-GitHub supplied context (`event`, `tasks_for`, etc.) (there should be no overlaps in the keys these provide - so they are treated as equal).
2) Project supplied context

Merging will be done shallowly - meaning that keys like `event` and `tasks_for` will be fully ignored if supplied by project context.

The reasoning behind this is that GitHub and Taskcluster-GitHub supplied context are largely "facts": things like revision, repository, the event that triggered Taskcluster-GitHub, etc. Allowing overriding could both be confusing (eg: a project hardcoding `tasks_for` to `github-push` would cause pull requests to run unexpected things), and a possible security vulnerability (eg: overriding `event.pusher.email` could allow impersonation leading to privilege escalation).

## Rendering process

When Taskcluster-GitHub encounters a `.taskcluster.yml` such as the one above when processing an event for a repository, instead of directly rendering it with the context from the GitHub event, it will instead:
1) Fetch the `.taskcluster.yml` referenced in `config-from`
2) Build context per the above
3) Render the fetched `.taskcluster.yml` with the combined context
4) Proceed as usual, creating any Tasks resulting from the rendered `.taskcluster.yml`

Note: Only a `.taskcluster.yml` defined directly in a project repository will have its `config-from` processed. There is no need to support recursion into multiple levels of references, and it is more likely to result in confusion than add any value.

# Implementation

<Once the RFC is decided, these links will provide readers a way to track the
implementation through to completion, and to know if they are running a new
enough version to take advantage of this change.  It's fine to update this
section using short PRs or pushing directly to master after the RFC is
decided>

* <link to tracker bug, issue, etc.>
* <...>
* Implemented in Taskcluster version ...
