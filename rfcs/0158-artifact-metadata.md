# RFC 158 - Artifact metadata
* Comments: [#158](https://github.com/taskcluster/taskcluster-rfcs/pull/158)
* Proposed by: @escapewindow

# Summary

The goal is to provide Artifact Integrity guarantees from the point the worker uploads an artifact, to the point that someone downloads that artifact to use. We can do this by:

1. adding SHA metadata to artifacts in the Queue,
2. ensuring that that metadata can't be modified once it's written, and
3. providing a download tool that queries the Queue for an artifact's location and SHA, downloads the artifact, and verifies the downloaded SHA matches the SHA provided by the Queue.

## Motivation

This would improve robustness and security. By storing a SHA to verify on download, we can avoid corrupt downloads. By verifying the read-only SHA before we use the artifact, we can detect malicious tampering of artifacts at rest before we use it for a critical operation.

(This would obsolete the [artifacts section of the Chain of Trust artifact](https://scriptworker.readthedocs.io/en/latest/chain_of_trust.html#chain-of-trust-artifacts), and improve artifact integrity platform-wide. See the [Chain of Trust implications](#chain-of-trust-implications) section below.)

# Details

## Adding artifact metadata to the Queue

First, we add a `metadata` dictionary to the `S3ArtifactRequest` type. This is a dictionary to allow for flexibility of usage. The initial known keys should include

```
ContentFilesize int64 `json:"contentFilesize"`
ContentSha256 string `json:"contentSha256"`
```

The sha256 field is required for Artifact Integrity. The filesize field is optional.

A future entry may be `ContentSha256WorkerSignature`, if we solve worker identity, though we may abandon this in favor of worker [re]registration.

We can optionally add a `metadata` dictionary to the `ErrorArtifactRequest` and `RedirectArtifactRequest` types.

A new `Queue.getArtifactInfo` endpoint will return the artifact URL and metadata.

## Ensuring that metadata can't be modified once it's written


* Queue would have no API to write to this data
* The backend storage (postgres) would be configured to not allow updates that would modify the data (so only select, insert, delete, not update)

## Providing a download tool

This tool queries the Queue for the artifact metadata, downloads the artifact, and verifies any shas. We should allow for optional and required metadata fields, and for failing out if any required information is missing, or if the sha doesn't match. We should be sure to measure the shas and filesizes on the right artifact state (e.g. combining a multipart artifact, not compressed unless the original artifact was compressed).

This tool should be usable as a commandline tool, or as a library that the workers can use.

Once we implement worker signatures in artifact metadata, the download tool will verify those signatures as well.

## Object Service

The future object service should be compatible with this proposal.

## Chain of Trust implications

As mentioned above, this RFC will deprecate the `artifacts` section of the Chain of Trust artifact, also known as the CoT artifact. The Chain of Trust has three primary guarantees:

1. the artifacts have not been modified at rest,
2. the workers which generated the artifacts are under our control, and
3. the tasks that the workers ran were generated from a trusted tree.

The CoT artifact has an `artifacts` section, containing artifact paths and checksums, to address guarantee #1. Once there is a platform supported way to store and verify checksums for artifacts, we will no longer need to do so in the CoT artifact.

# Implementation

* TBD
* Implemented in Taskcluster version ...
