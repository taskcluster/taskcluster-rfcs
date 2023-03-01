# RFC 182 - Allow remote references to .taskcluster.yml files processed by Taskcluster-GitHub
* Comments: [#182](https://github.com/taskcluster/taskcluster-rfcs/pull/182)
* Proposed by: @bhearsum

# Summary

Allow `.taskcluster.yml` files in GitHub repositories to outsource most of their contents to a `.taskcluster.yml` stored elsewhere.

## Motivation

`.taskcluster.yml` files in GitHub repositories are responsible for creating tasks (or not) in response to various GitHub events. In some cases (eg: when a decision task is used to delegate most of this to a separate tool), these files end up looking almost entirely identical, and hundreds of lines of JSON-e ends up duplicated across many different repositories. This duplication is a significant maintenance burden, and easily results in unwanted differences.

Allowing a `.taskcluster.yml` to reference a file stored elsewhere will allow for deduplication of the bulk of the content in these files, resolving the concerns noted above.

# Details

Two new variables will be introduced to `.taskcluster.yml` files. The first, `config-from`, will allow an URL to be provided that points at a full-fledged `.taskcluster.yml` hosted elsewhere. The second, `context`, will allow for variables to be defined that will be included with the JSON-e context when the referenced `.taskcluster.yml` is rendered. Here is an example of a possible concrete `.taskcluster.yml`:

```
---
version: 1
config-from: https://github.com/taskcluster/taskgraph/blob/main/data/taskcluster-yml-github.yml
context:
  project-name: mozillavpn
  scopes:
    - secrets:get:project/mozillavpn/*
```

When `config-from` is present in the `.taskcluster.yml`, existing top level keys such as `policy` and `tasks` are not valid. `context` is optional, and only permitted when `config-from` is present.

When Taskcluster-GitHub encounters a `.taskcluster.yml` such as the one above when processing an event for a repository, instead of directly rendering it with the context from the GitHub event, it will instead:
1) Fetch the `.taskcluster.yml` referenced in `config-from`
2) Combine the GitHub event context with the context provided in the repository's `.taskcluster.yml` (with GitHub event context taking priority)
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
