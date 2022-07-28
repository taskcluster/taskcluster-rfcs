# RFC 170 - Author Association Roles for Github Pull Requests

# Summary

Assume different roles for Github Pull Requests based on the PR author's association to the project.

## Motivation

Currently Taskcluster's [pullRequest policy][0] is very basic. It can either generate graphs for
everyone, or only for collaborators. If a project has a task that can access secrets or perform
actions that shouldn't be triggered publicly, then the only recourse is to not generate *any* graph
so long as the author is not at least a collaborator.

However, projects commonly have non-sensitive tasks that *could* otherwise be run publicly. Having
distinct roles based on author association would allow projects to generate graphs for public pull
requests, while simultaneously blocking these graphs from running sensitive tasks via scopes.

The motivations for this RFC overlap with [RFC 168][1].

# Details

A new `pullRequest` policy called `public_restricted` will be invented. When used, Taskcluster
Github will inspect the author association of the pull request to determine whether or not they are
a collaborator. If they are determined to be a collaborator, the current [pull-request][2] role will
be assumed. So far this behavior is identical to the `collaborators` policy.

However if the author is not a collaborator, a new role called `repo:github.com/${
payload.organization }/${ payload.repository }:pull-request-untrusted` will be assumed instead.

To allow projects to tell whether a pull request was created by a collaborator or not, a new
`tasks_for` value of `github-pull-request-untrusted` will be used to evaluate the
`.taskcluster.yml` file.

## Using the `public_restricted` policy

Using the `public_restricted` policy will require that both the Taskcluster instance and the project
are configured properly. While the details around this configuration are out of scope for this RFC,
it's worth providing a brief example to help illustrate how the feature might be used.

### Instance Configuration

Taskcluster administrators will need to ensure the `pull-request-untrusted` roles exist for any
projects that use the `public_restricted` policy. They'll also need to ensure that scopes are
properly assigned to block running any sensitive tasks on untrusted pull requests.

### Task Configuration

Projects that use the `public_restricted` policy will need to make sure they don't try to run
trusted tasks on untrusted PRs, otherwise they'll get a scope expression error. They'll be able to
accomplish this by inspecting the `tasks_for` field that Taskcluster Github now passes down to the
JSON-e context and checking for a value of `github-pull-request-untrusted`.

In the case of a plain `.taskcluster.yml` file, this value could be used in a JSON-e conditional
statement. In the case of Taskgraph, this could be passed in via a new parameter.

[0]: https://docs.taskcluster.net/docs/reference/integrations/github/taskcluster-yml-v1#pull-requests
[1]: https://github.com/taskcluster/taskcluster-rfcs/blob/main/rfcs/0168-Trigger-Tests-Based-on-PR-Comments.md
[2]: https://github.com/taskcluster/taskcluster/blob/b31b890043847059c2d09dc7e2428814b9b51c0b/services/github/src/tc-yaml.js#L184
