# RFC 165 - Anonymous scopes
* Comments: [#165](https://github.com/taskcluster/taskcluster-rfcs/pull/165)
* Proposed by: @ricky26

# Summary

We currently assign no scopes to calls with no credentials. With this proposal
we would assign a single role to all calls and any scopes expanded from that.
Additionally, we will move all API calls behind at least one scope.

## Motivation

This is primarily aimed at private Taskcluster installations. With this, it will
be possible to prevent any useful access to the Taskcluster installation without
credentials.

This RFC doesn't propose changes to the UI as it's considered part of a minimal
path towards private Taskcluster installations and inoperative UI when not
logged in is acceptable.

# Details
## Implementation
A single scope will be assumed for all calls (with or without credentials):
`assume:anonymous`. In order to implement this, changes will be made in a few
areas:
- A new API call will be added to the auth service (`authenticateAnonymous`)
  which will return the expanded scopes of `["assume:anonymous"]`.
- All API calls which currently require no scopes will be given explicit
  required scopes, ideally matching their counterparts already with required
  scopes. These exact scopes will be decided at implementation time.
- The authentication middleware in `taskcluster-lib-api` used by all services
  will no longer early out if there are no authorization headers.
- The remote signature validator (used by all services except the auth service)
  will call `authenticateAnonymous` if no authorization headers are passed.
- The auth service signature validator will be changed to return the scopes
  expanded from `["assume:anonymous"]` if no credentials are passed.
- The auth service signature validator will include the expanded anonymous
  scopes when using credentials **after** applying scope restriction.
- The API builder in `taskcluster-lib-api` will be changed to assert that
  at least one scope is required except for endpoints which explicity opt-out
  (which should be just `authenticateHawk` and `authenticateAnonymous`).
- `expandScopes` will **not** be changed to include the anonymous role as this
  is then within the power of the caller.
- Add `assume:anonymous` to the scopes returned by `User::scopes` in
  `web-server`. (This is adding an assumption about the anonymous role but
  a similar assumption is made about `assume:login-identity:` already).

## Drawbacks
- Scopes will be expanded every call, this will cause additional overhead for
  anonymous calls.
- There will need to be some kind of migration to ensure that public
  clusters automatically inherit the view scopes for all calls.
  - This could be done as a database migration, inserting all added required
    scopes to the anonymous role as all Taskcluster installations older than
    this change will be assumed to be public.

## Alternatives
- Instead of the `authenticateAnonymous` endpoint, allow the `authenticateHawk`
  endpoint to accept requests with no hawk/bewit credentials and return just
  the anonymous scopes.
- Instead of adding `authenticateAnonymous`, allow the `authenticateHawk`
  endpoint to return the anonymous scopes when the authorization parameters
  are missing.
- Instead of including `assume:anonymous` in `authenticateHawk` and calling
  `authenticateAnonymous` at the signature validation stage, alter the
  `taskcluster-lib-api` auth middleware to include the anonymous scopes before
  testing the scope expression.
- When adding anonymous scopes to calls with credentials, add them **before**
  restriction, so that anonymous scopes can be restricted. This will require
  additional migration effort but may reduce the surprise compared to the
  preferred implementation.

## Future considerations
This RFC will introduce more load on the auth service. With the preferred
implementation it should be quite easy to add caching in a later RFC.

# Implementation
