# RFC 168 - Process Github issue_comment events to support adhoc task creation
* Comments: [#168](https://github.com/taskcluster/taskcluster-rfcs/pull/168)
* Proposed by: @bhearsum

# Summary

Listen, and render `.taskcluster.yml`, for Github `issue_comment` events.

## Motivation

Multiple use cases for triggering tasks in an adhoc manner on Pull Requests have come up recently. Most notably:
* Triggering tasks for PRs opened by a non-collaborator
* Triggering tasks that don't run by default (ie: because they're expensive)

As Taskcluster is used increasingly for high-importance projects on Github (like Fenix), it's important that we're able to support these use cases.

# Details

`.taskcluster.yml` will be modified to support a new `allowComments` policy, which will support `collaborators` as a value. When set, collaborators to the repository may add a comment containing a string beginning with "/taskcluster ", which will cause Taskcluster-Github to render `.taskcluster.yml` with `tasks_for` set to `github-issue-comment`, and a new context variable `event.issue.comment` set to everything appearing after "/taskcluster " in the comment. For example, a comment of "/taskcluster run-tests" will set `event.comment` to `run-tests`. This will allow `.taskcluster.yml` implementers the flexibility to take different actions based on the comment. Some examples:
* A comment of "/taskcluster run-tests" could trigger all Tasks
* A comment of "/taskcluster run-test-foo" could trigger just the `foo` Task
* A comment of "/taskcluster merge" could trigger a Task that merges the PR

To support this, Taskcluster-Github will be modified to watch for [`issue_comment`](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#issue_comment) events. When one is received, it will check if:
* The `allowComments` policy is set to `collaborators` in the `.taskcluster.yml` on the default branch
* The `sender` is a valid collaborator

If the above is true, it will process the `.taskcluster.yml` as described above, and create any resulting Tasks.

Because we will be listening for a new event, existing installations that want to make use of this feature will need to re-authorize the Taskcluster integration. New installations will get it by default upon install.

This has been previously discussed in https://github.com/taskcluster/taskcluster-rfcs/issues/95 and https://github.com/taskcluster/taskcluster/issues/40.

# Implementation

* Tracking bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1715848
* RRA (to be scheduled after RFC is Accepted)
