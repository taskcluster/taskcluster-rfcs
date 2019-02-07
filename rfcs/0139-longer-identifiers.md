# RFC 139 - Increase identifier length from 20 to 38
* Comments: [#139](https://api.github.com/repos/taskcluster/taskcluster-rfcs/pull/139), [Bug 1520579](https://bugzilla.mozilla.org/show_bug.cgi?id=1520579)
* Proposed by: @djmitche / @mitchhentges

# Summary

For identifiers that typically contain structure (vs. those containing only
slugid's), increase the maximum length from 22 to 40 characters, while ensuring
that we do not overflow AMQP routing key lengths.

## Motivation

We have an established pattern of encoding meaning into some identifiers, such as workerTypes (e.g., `aws-provisioner-v1/gecko-1-b-*`), but these are limited to 22 characters.
That is too short to encode much meaning.
We cannot allow arbitrary lengths, as these identifiers are included in AMQP routes which have a hard limit of 255 characters.
We can, however, allow more than 22 characters.

# Details

We will define two types of identifiers:

* "identifiers" -- up to 38 characters, generally containing human-readable identifiers
  * `provisionerId`, `workerType`, `workerGroup`, `workerId`
  * `schedulerId`

* "slugids" -- exactly 22 characters, always a slugid
  * `taskGroupId`
  * `taskId`

The following remain separate:
  * `organization`, `repository` (limited to 100 characters in taskcluster-github)

The rationale for the choice of 38 is the [task status routing key](https://docs.taskcluster.net/docs/reference/platform/taskcluster-queue/references/events#routing-key) which contains

| name           | max characters |
|----------------|----------------|
| routingKeyKind | 7              |
| taskId         | 22             |
| runId          | 3              |
| workerGroup    | N              |
| workerId       | N              |
| provisionerId  | N              |
| workerType     | N              |
| schedulerId    | N              |
| taskGroupId    | 22             |
| reserved       | 1              |

With a total of 9 dots between each of those components.
So the total length is `5N + 55 + 9 <= 255`.
Solving for N, we get 38. 

This change requires changes to schemas and API declarations in services in the monorepo, as well as to `aws-provisioner` and possibly `ec2-manager`, workers, and client libraries.
Much of this work has [already been done](https://github.com/taskcluster/taskcluster/pull/110) by @OjaswinM.

We already have checks on AMQP routing key lengths, and the increased length does not cause any failures in that code.

# Implementation

* [taskcluster/taskcluster#110](https://github.com/taskcluster/taskcluster/pull/110)
* [Bug 1520579](https://bugzilla.mozilla.org/show_bug.cgi?id=1520579)
