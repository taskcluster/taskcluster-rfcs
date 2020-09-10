# RFC 165 - Anonymous scopes
* Comments: [#165](https://github.com/taskcluster/taskcluster-rfcs/pull/165)
* Proposed by: @ricky26

# Summary

We currently assign no scopes to calls with no credentials. With this proposal
we would assign a single role to all calls and any scopes expanded from that.
Additionally, we will move all API calls behind at least one scope.

## Motivation

This is primarily aimed at private TaskCluster installations. With this, it will
be possible to prevent any useful access to the TaskCluster installation without
credentials.

# Details
## Implementation
A single scope will be assumed for all calls (with or without credentials):
`assume:anonymous`. A new API call will be added to the auth service
(`authenticateAnonymous`) which will return `{"scopes":...,"expiry":...}`.
The authentication middleware will call `authenticateAnonymous` but cache the
result until `expiry`. A deploy-time variable will be added (`auth.scopes_ttl`)
which configures how long the auth service declares looked up scopes to be
valid. 

All API calls which currently require no scopes will require
`<service-name>:view`. This leaves room to add more specific scopes at a later
date.

## Drawbacks
- Scopes will be expanded every call, this will cause additional overhead for
  anonymous calls
  - This is largely mitigated by caching the anonymous scopes, even a relatively
    small TTL (such as 10 seconds) is enough to mitigate the brunt of the cost.
- There will need to be some kind of migration to ensure that public
  clusters automatically inherit the view scopes for all calls.
  - This could be done as a database migration, inserting `:view` for each
    service under `assume:anonymous`.

## Alternatives
- Instead of the `expiry` field, add a config variable to all services which
  controls this.
  - This would make the change more sweeping.
- Instead of the `authenticateAnonymous` endpoint, add an `expiry` field to
  `expandScopes` in order to know how long to cache the anonymous scopes.

# Implementation
