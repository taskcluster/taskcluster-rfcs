# RFC 176 - Skip CI in github integration
* Comments: [#176](https://github.com/taskcluster/taskcluster-rfcs/pull/176)
* Proposed by: @lotas

# Summary

Allow to skip running tasks for certain commits containing `[ci skip]`/`[skip ci]` keyword.

## Motivation

This will allow to save computing resources and give more flexibility for the Taskcluster users on Github.
Not all commits require tasks to be run, for example, updating README.
All major CI platforms provide this functionality.

# Details

This will be implemented in the webhook API handler. Depending on the `.taskcluster.yml` configuration, tasks could be created for both `push` and `pull-request` events, so we'll have to do those checks on both.

## `push` event

For the push event, we will check if the head commit includes one of the `[ci skip]`, `[skip ci]` keywords in its message. If message is found, this webhook event will be ignored. No messages will be published to the rabbitmq exchange, so no tasks will be started from this event.

If push consists of multiple commits, we would only check the head or the latest one.

## `pull_request` event

To prevent whole pull request from running tasks, we will check if its title contains `[ci skip]`, `[skip ci]` keywords.
In this case, API handler will stop processing pull request event and will not publsh any event to the exchange. No tasks will be generated.

# Implementation

* Original request issue [#5311](https://github.com/taskcluster/taskcluster/issues/5311)
* Initial imlpementation [#5612](https://github.com/taskcluster/taskcluster/pull/5612)
* Ongoing fixes and improvements [#5617](https://github.com/taskcluster/taskcluster/pull/5617)
