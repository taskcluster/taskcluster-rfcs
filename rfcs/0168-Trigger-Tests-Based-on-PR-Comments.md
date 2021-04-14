# RFC 168 - Allow comments to trigger Tasks for non-collaborators
* Comments: [#168](https://github.com/taskcluster/taskcluster-rfcs/pull/168)
* Proposed by: @bhearsum

# Summary

Allow collaborators to a Github repository to request that Tasks be run on Pull Requests that ran no Tasks due to a restrictive `pullRequests` policy.

## Motivation

Increasingly, Taskcluster is being used for projects hosted on Github. In many of these projects, Tasks that are run during Pull Requests rely on secrets or other sensitive information. In these cases we usually use a `pullRequests` policy of `collaborators` to ensure that untrusted people cannot gain access to such things. Because of this, it means we have no reasonable way of verifying Pull Requests submitted by non-collaborators. Workarounds have been found (eg: a separate Github Actions flow for such PRs) but this is both burdensome and typically does not provide robust enough testing.

# Details

`.taskcluster.yml` will be modified to support a new `allowApprovals` policy, which will support `collaborators` as a value. When set, collaborators to the repository may add a comment containing a string beginning with "/taskcluster ", which will cause Taskcluster-Github to render `.taskcluster.yml` with `tasks_for` set to `github-issue-comment`, and a new context variable `event.issue.comment` set to everything appearing after "/taskcluster " in the comment. For example, a comment of "/taskcluster run-tests" will set `event.comment` to `run-tests`. This will allow `.taskcluster.yml` implementers the flexibility to take different actions based on the comment. Some examples:
* A comment of "/taskcluster run-tests" could trigger all Tasks
* A comment of "/taskcluster run-test-foo" could trigger just the `foo` Task
* A comment of "/taskcluster merge" could trigger a Task that merges the PR

To support this, Taskcluster-Github will be modified to watch for [`issue_comment`](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issue_comment) events. When one is received, it will check if:
* The `allowApprovals` policy is set to `collaborators` in the `.taskcluster.yml` on the default branch
* The `sender` is a valid collaborator

If the above is true, it will process the `.taskcluster.yml` as described above, and create any resulting Tasks.

Because we will be listening for a new event, existing installations that want to make use of this feature will need to re-authorize the Taskcluster integration. New installations will get it by default upon install.

This has been previously discussed in https://github.com/taskcluster/taskcluster-rfcs/issues/95 and https://github.com/taskcluster/taskcluster/issues/40.

# Implementation

* RRA (to be scheduled after RFC is Accepted)
