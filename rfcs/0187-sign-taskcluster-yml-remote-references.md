# RFC 187 - Integrity checks for .taskcluster.yml remote references (addendum to #182)
* Comments: [#187](https://github.com/taskcluster/taskcluster-rfcs/pull/186)
* Proposed by: @bhearsum

# Summary

Require remotely referenced `.taskcluster.yml` files to be verifiable through a detached signature.

## Motivation

In #182 we discussed and agreed on a mechanism to allow for deduplication of `.taskcluster.yml` files by supporting pointers to a `.taskcluster.yml` file hosted elsewhere. Something we did not discuss there was how to verify that these files have not been tampered with (being overridden, man-in-the-middle, etc.).

This is a crucial detail to iron out before we implement it.

# Details

To accommodate integrity checks, Taskcluster-GitHub will require that any remotely referenced `.taskcluster.yml` files have an associated detached GPG signature which can be verified by a public GPG key that it has been configured with.

Integrity checks will be on by default, but can be disabled by setting `allow-unsigned-remote-references` to `True`.

Taskcluster-GitHub will allow for zero, one, or many public keys to be configured in its `config.yml`. If zero public keys are configured and `allow-unsigned-remote-references` is `False`, remote references are not supported. If `allow-unsigned-remote-references` is `True` and one or more keys are configured, any `.taskcluster.yml` that is verifiable by _any_ of the configured keys is permitted to be used. (That is to say: keys are not scoped in any way, nor does the order in which they are listed in the config matter.)

The procedure for verifying a remotely referenced `.taskcluster.yml` will be as follows:
/) Resolve the `config-from` entry to a raw URL (eg: github.com/taskcluster/taskgraph/data/taskcluster-yml-github.yml@main becomes https://github.com/taskcluster/taskgraph/raw/main/data/taskcluster-yml-github.yml)
2) Construct the raw URL for the detached signature by appending `.asc` to the `.taskcluster.yml` URL. (eg: https://github.com/taskcluster/taskgraph/raw/main/data/taskcluster-yml-github.yml.asc)
3) Download both files. If either one does not exist, exit.
4) Iterate over the available public keys and try to verify the `.taskcluster.yml` against the `.asc`. If any verification succeeds, proceed as usual. If no verifications succeed, exit.

In the event of verification error, a comment should be left on the GitHub commit or Pull Request that caused Taskcluster-GitHub to fire.

# Implementation

Part of [Issue #6138](https://github.com/taskcluster/taskcluster/issues/6138).
