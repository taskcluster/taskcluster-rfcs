# RFC 147 - Third-Party Login
* Comments: [#147](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/147)
* Proposed by: @djmitche

# Background

Taskcluster is an API service and has no notion of “users”.
Instead, it respects Taskcluster credentials which carry authorization information with them.

However, Taskcluster has a browser-based user interface, and users can “sign in” to that interface using one of a variety of authentication providers such as Auth0 or GitHub.
When they do so, they are given credentials, and the authorization information in those credentials are derived from details of their user account such as group membership.

Other, third-party (non-Taskcluster) services also accept Taskcluster credentials -- this is especially common for CI-related services.
The interfaces for such services typically need to do their own user authentication, but also want to utilize Taskcluster credentials.

We also have a command-line tool which can interact with a local browser to fetch credentials and place them in environment variables for use by scripts.
This tool’s functionality is similar to `heroku login`, for example.

## History

### Early Revisions

Long ago, we supported this via a simple redirect flow, where a site redirected the user to `https://login.taskcluster.net/` with a callback URL and some other information.
The login site gathered user consent and redirected the user back with taskcluster credentials in the URL.
This supported both third-party login with other sites and command-line login.
Problems with this approach included

* The redirect flow and unfamiliar appearance of the site caused user confusion
* Credentials were (arbitrarily) limited to 3 days, so users had to re-consent every 3 days (note that we did “whitelist” some specific third parties, keyed by callback URL)
* Many federated sites wanted user information, and Taskcluster does not provide that

The returned credentials always contain the full authorization for the user, even if only a small subset are required.

### Current Implementation

The current iteration is based on features available only from Auth0.
The third party site is required to use the Mozilla Auth0 integration, and to include an audience and scope corresponding to the Taskcluster service in the authentication request.
Seeing this audience value, Auth0 presents a consent page on a user’s first time, then returns an access_token which is good both for the usual access to the Auth0 APIs, and for access to call a Taskcluster API method.
That method validates the access_token, constructs short-term credentials based on the indicated user, and returns them.

This approach is used both by the Taskcluster UI and by third-party sites, putting the two on an equal footing.
It, too, has some disadvantages:

* Command-line logins are not supported (see the “Client Creator”, below)
* The approach is tied to Auth0, while we would like to support direct GitHub login as well
* Auth0’s implementation of “consent” has not developed as expected
* It is not a “normal” Auth0 login process (particularly in its use of the Auth0 API functionality) and this causes confusion both for the IAM team and for third parties integrating with Taskcluster
* The returned credentials always contain the full authorization for the user, even if only a small subset are required (see bug 1449654)

### Client Creator

To support command-line logins, the tools site has a “client creator” which creates new credentials that last for 3 days by default.
These credentials are scanned on a daily basis and disabled if they authorize more than the associated user has access to (such as if the user was removed from an access group).

The client creator operates in a similar fashion to the “early revisions” described above: the command-line tool opens the browser to a well-known URL and includes a callback URL and some other metadata including the authorizations required of the resulting credentials.
The page presents the requested information to the user for consent, and then redirects to the callback URL with the generated credentials.

# Proposed Solution

## Requirements

* Support command-line logins
* Support third-party logins
* Support issuing limited-authorization credentials
* Support whitelisting some third parties
* Support revocable credentials

## Overview

The proposal is to adapt the client creator to support the requirements and avoid some of the disadvantages of the previous approaches.
Specifically:
* Utilize the familiar Taskcluster UI appearance and origin to encourage user trust
* Use an authentication-code flow to avoid putting credentials in URLs
* Whitelist third parties along with a limited set of allowed authorizations for those third parties, such that the redirect flow does not require user interaction

The result is similar to a normal OAuth authorization-code flow, but resulting in Taskcluster credentials instead of an access_token.

## Implementation

The "big picture" here is that a Taskcluster deployment acts as an OAuth2 authorization server and resource server.
The "resource" that the deployment protects is temporary Taskcluster credentials.
Thus a client carries out a standard OAuth2 authorization transaction, then uses the resulting `access_token` to request Taskcluster credentials as needed.

### OAuth2

Taskcluster implements the [OAuth2 protocol](https://tools.ietf.org/html/rfc6749), supporting both the "Implicit" and "Authorization Code" flows.
The "Resource Owner Password Credentials" and "Client Credentials" flows are not supported.

Clients are pre-defined, and each pre-defined client indicates which flow it uses (and cannot use both).
Some clients are whitelisted, meaning that user consent is not required.

What follows describes this flow.
Small modifications might be required in the implementation to allow standard OAuth2 client libraries to interact easily with Taskcluster.

#### Authorization Code Flow

The authorization flow looks like this (adapted from RFC6749):

```

     +----------+
     |          |
     |   User   |
     |          |
     +----------+
          ^
          |
         (B)
     +----|-----+          Client Identifier      +---------------+
     |         -+----(A)-- & Redirection URI ---->|               |
     |  User-   |                                 |  Taskcluster  |
     |  Agent  -+----(B)-- User authenticates --->|  Web-Server   |
     |          |                                 |               |
     |         -+----(C)-- Authorization Code ---<|               |
     +-|----|---+                                 +---------------+
       |    |                                         ^      v
      (A)  (C)                                        |      |
       |    |                                         |      |
       ^    v                                         |      |
     +---------+                                      |      |
     |         |>---(D)-- Authorization Code ---------'      |
     |  Client |          & Redirection URI                  |
     |         |                                             |
     |         |<---(E)----- Access Token -------------------'
     +---------+
```

*(A)* The client initiates the flow by directing the resource owner's user-agent to the authorization endpoint as specified in RFC 6749 section 4.1.1.
It is `<rootUrl>/login/oauth/authorize` with the following query parameters:

* `response_type` - (required) "code"
* `client_id` - (required) the client's ID
* `redirect_uri` - (required) the URL to which the browser should be redirected after authorization
* `scope` - (required, can be repeated) A Taskcluster scope the client would like the resulting credentials to authorize.  This can end with `*`.
* `state` - (optional but recommended) An opaque value used by the client to maintain state between the request and callback
* `expires` - (optional, nonstandard) The requested lifetime of the resulting Taskcluster credentials, in a format understood by [`fromNow`](https://github.com/taskcluster/taskcluster/tree/master/clients/client#relative-date-time-utilities), defaulting to "3 days"

Note that the `client_id` in this transaction is an OAuth2 "client" and not a Taskcluster "client".
Similarly, `access_token` is an OAuth2 access token, distinct from the `accessToken` property of Taskcluster credentials.
This coincidence of naming can be confusing to users and should be explained clearly in documentation.

*(B)* The authorization endpoint authenticates the user and authorizes the request.
This page first verifies that the user is signed in, inviting them to do so otherwise.

Assuming the user is signed in to the Taskcluster UI, the page next checks whether the client is whitelisted.
Each whitelisted client is paired with a list of expected `scope` URL parameters.
If the client and scope parameters match the whitelist, the request is considered automatically accepted with no user interaction.
If the client appears in the whitelist but the scope parameters do not match those specified in the whitelist, the request fails with an error callback (see below).
Otherwise, the page proceeds to gather user consent as below.

A Taskcluster `clientId` is generated by concatenating the user’s identity (e.g., `github/djmitche|12345`) and the requested name, separated by a slash.
If that clientId already exists, then the user is prompted to choose a unique name or reset the access token for that existing user.
Resetting the access token is the default option for whitelisted third parties.

Once the `clientId` is determined, then the user is presented with a form requesting their consent.
The focus of the form is on granting access to Taskcluster on the user’s behalf to the OAuth2 client.
The proposed client's details are as follows:

* `description` - "Client generated by (user identity) for OAuth2 Client (client id)"
* `scopes` - the scope-set intersection of the `scope` query parameters and the user's scopes
* `expires` - the expiration date indicated by the `expires` query parameter

Details buttons will allow the user to see and edit these values.
Note that consent is not cached: for non-whitelisted clients, user interaction is required every time.

*(C)* If the user consents, the browser is redirected back to the `redirect_uri` as specified in RFC6749 section 4.1.2.

*(D)* The client requests an access token from the authorization server's token endpoint by including the authorization code received in the previous step.
The token endpoint matches RFC 6749 section 4.1.3.
It is `<rootUrl>/login/oauth/token`, with the query parameters described in that section.

*(E)* The token endpoint returns an access token response as described in RFC 6749 section 4.1.4.
The response does not include a refresh token, and the access token expiration is always 15 minutes.

Errors are handled with the error response callback described in RFC 6749 section 4.1.2.1.

#### Implicit Flow

The implicit flow is similar to the authorization code flow described above, with differences highlighted in RFC 6749.

Clients using implicit flow cannot be whitelisted, as the implicit flow is considered less secure.

### Resource Server

The Taskcluster deployment acts as a "resource server" by serving Taskcluster credentials in given a valid OAuth2 `access_token`.

This is accomplished by calling the endpoint `<rootUrl>/login/oauth/credentials` with the header
```
Authorization: bearer <access_token>
```

The response is a JSON body of the form:
```json
{
    "credentials": {
        "clientId": "...",
        "accessToken": "..."
    },
    "expires": "..."
}
```

Note that this is the *only* Taskcluster endpoint that accepts the OAuth2 access token.
All other endpoints require Taskcluster credentials.

The `expires` property gives the expiration time for the given credentials, and corresponds to the `expires` value the user earlier consented to.
The client indicated in the credentials has the clientId described above, and as such is scanned periodically for alignment with the associated user's access.
It will be automatically disabled if the user's access no longer satisfies its scopes.
The client can also be disabled or deleted manually in the event of compromise.

## Client Registration

The initial implementation of this proposal will "register" clients by including them in the deployment configuration of the web-server service.

Later improvements may move that to a runtime configuration, allowing management of clients via API calls.

## Command-Line Login

The [shell client](https://github.com/taskcluster/taskcluster/tree/master/clients/client-shell#readme) includes a `taskcluster signin` command that makes it easy to use Taskcluster credentials from the command line.
The initial implementation of this proposal will use a statically configured implicit client with OAuth2 client ID `taskcluster-signin` for this purpose.
The OAuth2 implementation will be modified to allow `redirect_uri`s of the form `http://localhost:<port>` for any port for this client.

Later improvements may replace this approach with a more robust solution based on [PCKE](https://tools.ietf.org/html/rfc7636).

# Implementation Links

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* https://bugzilla.mozilla.org/show_bug.cgi?id=1561905
