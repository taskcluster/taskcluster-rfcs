# RFC 180 - Github cancel previous tasks
* Comments: [#180](https://github.com/taskcluster/taskcluster-rfcs/pull/180)
* Proposed by: @lotas

# Summary

Allow to automatically cancel previous pipelines for github `push` and `pull_request` events.

## Motivation

This will allow to save computing resources and give more flexibility for the Taskcluster users on Github.
When several pushes happen to the same branch within a short amount of time, like hotfixes or rebases,
only the last commit and pipelines matters.
By cancelling previous task groups and tasks we could save significant amount of compute resources and developer hours by not running redundant tasks.

# Details

## Github hooks

This will only apply to non-default branches (and possible protected branches?),
to allow all pushes to the default branch to have their own builds.

To be flexible and allow some projects to still run checks for all events, we could add new key to the `.taskcluster.yml` configuration.
We can introduce top-level configuration option `autoCancelPreviousChecks: true` (having `true` by default) to control if this behaviour is desired.

Github's webhook handler upon receiving `push` event would check if there are other task groups existing for given branch, that are not HEAD.
If `autoCancelPreviousChecks` is set to `true` it will cancel them.

Cancellation will happen for all the non-resolved tasks within the same `taskGroupId`. However, due to the fact that tasks can create their own sub-tasks, there might be cases where running tasks would still manage to create some tasks that might not be cancelled.

## Github API

To make it easier for developers to cancel running builds associated with some specific branch we can expose new API endpoint. `github.cancelBuilds({ organization, repository, branch })` would be able to find all task groups associated with this branch, find all non-resolved tasks within those groups and cancel those.


# Implementation

* Original request issue [#5621](https://github.com/taskcluster/taskcluster/issues/5621)
