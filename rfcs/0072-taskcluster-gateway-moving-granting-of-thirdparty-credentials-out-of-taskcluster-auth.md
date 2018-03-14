# RFC 72 - taskcluster-gateway - moving granting of thirdparty credentials out-of taskcluster-auth
* Comments: [#72](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/72)
* Initially Proposed by: @jonasfj

# Proposal
We should have a service that issues temporary credentials for:
 * S3
 * sentry
 * statsum
 * azure SAS blob/table
 * webhooktunnel
 * etc...

We have a lot of small methods that translate TC scopes to temporary third-party credentials.
We should not add these to taskcluster-auth, but instead factor them out into a separate service.

Note: We only group these because on their own they are simple and don't involve anything super complicated. Complicated credentials that needs to be tracked, like pulse credentials, a separate service should be written.