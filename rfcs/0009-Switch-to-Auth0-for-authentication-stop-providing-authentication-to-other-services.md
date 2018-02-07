# RFC 9 - Switch to Auth0 for authentication, stop providing authentication to other services
* Comments: [#9](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/9)
* Initially Proposed by: @djmitche

# Proposal
We currently do a poor job of providing authentication to other services, notably treeherder.  We do a swell job of providing authorization, though!  Let's reposition ourselves so that we provide a really awesome mechanism for API access control that is usable both by API implementers and API users.  We are already pretty awesome for API implementers, so this idea only changes the situation for API users.

# Proposal

use a three-party authentication system to allow user-facing apps to get taskcluster credentials for their users.  The parties are
 * the user
 * the client (a webapp, like treeherder or tools)
 * the resource server (taskcluster)

The flow is this:
 * Client authenticates the user using Auth0, using an OIDC request that includes taskcluster as an audience.
 * Client can use this authentication information directly.
 * Client passes the resulting OIDC token to Taskcluster requesting corresponding TC credentials. TC verifies the token, looks up additional user information, and genereates and returns the credentials.
 * Client accesses TC APIs on behalf of the user with the resulting credentials.

This corresponds to the Auth0 "API" functionality, with TC taking the part of the API.  It's a little different from Auth0's plan in that Auth0 expects the API to accept OIDC tokens directly, whereas TC expects TC credentials.  So we add the single OIDC -> TC credential transaction for that purpose.

# Advantages

With this in place, we can transition services currently using the login.taskcluster.net redirect flow for logins to instead use this mechanism.  This includes Treeherder, Treestatus, and probably a few others.  The advantage for these users comes from better support for authentication (they get a rich set of information from auth0) and a more dynamic login process.  It also puts the burden of user management on the IAM team, and not us.

# Links

* https://bugzilla.mozilla.org/show_bug.cgi?id=1354251
* https://github.com/taskcluster/taskcluster-login/pull/48 (proof of concept)