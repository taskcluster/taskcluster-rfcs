# RFC 139 - Increase identifier length from 20 to 44
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

* "identifiers" -- up to 40 characters, generally containing human-readable identifiers
  * `provisionerId`, `workerType`, `workerGroup`, `workerId`
  * `schedulerId`
  * `organization`, `repository` (in tc-github)

* "slugids" -- exactly 22 characters, always a slugid
  * `taskGroupId`
  * `taskId`

This change requires changes to schemas and API declarations in services in the monorepo, as well as to `aws-provisioner` and possibly `ec2-manager`, workers, and client libraries.
Much of this work has [already been done](https://github.com/taskcluster/taskcluster/pull/110) by @OjaswinM.

We already have checks on AMQP routing key lengths, and the increased length does not cause any failures in that code.

# Open Questions

TBD

# Implementation

* https://github.com/taskcluster/taskcluster/pull/110
* TBD
