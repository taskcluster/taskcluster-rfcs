# RFC 166 - Sign Public S3 URLs
* Comments: [#166](https://github.com/taskcluster/taskcluster-rfcs/pull/166)
* Proposed by: @ricky26

# Summary

At the moment, there are two S3 artefact buckets: one for public artefacts and
one for private artefacts. We will introduce a deploy-time parameter which
configures whether URL signing is used for the public artefacts bucket.

## Motivation

This is primarily targeted at private installations of TaskCluster. As part of 
running a private TaskCluster installation, it would be ideal to have no
publicly accessible S3 buckets.

At the moment, the public bucket needs to be exposed globally as we redirect to
public S3 URLs. For the private bucket, we avoid this requirement by using S3
signed URLs.

We already have two code paths for artefact URLs and this would just mean always
using signed URLs in private TaskCluster installations.

# Details
Signed S3 URLs have a drawback compared to public URLs: they have an expiry
time. Introducing this change will lead to a situation where artefact URLs
fetched for public artefacts from a TaskCluster installation with this flag will
expire whereas otherwise they would not.

Implementation:
- Introduce a new deploy-time variable used to determine whether to sign all
    S3 URLs.
    - `queue.sign_public_artifact_urls` in the deployment config
    - `SIGN_PUBLIC_ARTIFACT_URLS` in the environment
    - `signPublicArtifactUrls` in the app config
- Change `replyWithArtifact` to use `createSignedUrl` if the artefact is in a
    public bucket and `signPublicArtifactURLs` is true.

As it stands, this will disable the CDN and the cache for most requests made for
public artefacts. There are some mitigations for these but they are expected to
be considered as later additions rather than part of this RFC:
- Round the current time used to generate signed requests to produce
    the same URL more frequently.
- Implement CloudFront signed URL generation and use it when possible.

These downsides will only affect installations using signed URLs everywhere.

# Implementation

