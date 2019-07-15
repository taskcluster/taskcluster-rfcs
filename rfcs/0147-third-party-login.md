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

*This section will get into the details a little bit and assumes familiarity with Taskcluster root URLs, Taskcluster credentials, clients, and scopes.*

### Authorization Flow

#### Initial Redirect
To https://<rootUrl>/auth/clients/new

Available query parameters:
* name - the name of the service requesting credentials; used to generate the clientId
* description - description of the resulting client
* scope - (multiple allowed) requested scope; the resulting client will have the intersection of the user’s scopes and the requested scopes
* expires - time offset until credentials expire (e.g., 1d or 36h)
* callback_url - url for the calling service; for command-line logins this is a `http://localhost:<port>` URL.
* state - csrf prevention token: a value generated by the third party and validated in the success and error callback conditions

This page is implemented by the Taskcluster UI.
This page first verifies that the user is signed in, inviting them to do so otherwise.

Assuming the user is signed in to the Taskcluster UI, the page next checks whether the callback_url is whitelisted.
Each whitelisted callback_url is paired with a list of expected `scope` URL parameters.
If the callback_url and scope parameters match the whitelist, the request is considered automatically accepted with no user interaction.
If the callback_url appears in the whitelist but  the scope parameters do not match those specified in the whitelist, the request fails with an error callback (see below).
Otherwise, the page proceeds to gather user consent as below.

A clientId is generated by concatenating the user’s identity (e.g., `github/djmitche|12345`) and the requested name, separated by a slash.
If that clientId already exists, then the user is prompted to choose a unique name or reset the access token for that existing user.
Resetting the access token is the default option for whitelisted third parties.

If the clientId is unique (or made unique), then the user is presented with a form requesting their consent.
The focus of the form is on granting access to Taskcluster on the user’s behalf to the origin of the callback_url.
Details buttons will show the description, calculated scopes, and expiration.
Users can edit these values if desired.

If the callback URL is a localhost origin, the form can show some specific advice for command-line logins.

If the user consents, the client parameters are sent to the backend server via a GraphQL request and exchanged for a random, authorization code.
The backend uses the signed-in user’s credentials to create a new client and store its credentials in a table keyed by authorization code and with a short expiration time such as 5 minutes.
This table is periodically scanned to purge expired entries.

Note that consent is not cached: for non-whitelisted sites, user interaction is required every time.

The browser is then redirected to a success callback with this authorization code and state token (see below).

#### Success Callback
To <callback_url>?code=...&state=...

The third party first verifies that the state parameter matches the state value it passed in the initial redirect, and treats the callback as an error if not.

If the state is OK, then the third party makes an HTTP POST to <rootUrl>/login/third-party with a JSON body containing {“code”: ..”}.
This request goes to the backend, which looks up the credentials for the given code.
The response contains the requested credentials in the form {“clientId”: .., “accessToken”: .., “certificate”: ..}, possibly omitting the certificate.
The backend deletes the table entry so it cannot be re-used.
The third party then uses these credentials to make Taskcluster API calls.

#### Error Callback
To <callback_url>?error=...&state=...

The third party verifies the state just as in the success callback condition.
If that matches, it displays the error message (suitably escaped, of course) and considers the flow to have failed.

# Open Questions

## Third-Party Registration

The proposal does not require third parties to “register” with Taskcluster.
This simplifies the implementation for Taskcluster by avoiding the need for a table of third parties and associated UI.
It also makes command-line logins possible without pre-registration of the command-line client.
This also matches Taskcluster’s design goal of self-service.
The user-consent form is sufficient to prevent anyone with a lot of scopes from granting them to untrusted sites.

However, it does mean that stealing a user’s authorization code is sufficient to steal their credentials (subject to some timing limitations).
The usual fix to this is to register third parties and assign them a secret value which is submitted along with the authorization code, thereby ensuring that the code can only be used by the intended recipient.

Since we already implicitly require registration to whitelist a third party, perhaps a good compromise is to issue secret codes only to whitelisted third parties.
These secrets could be configured in the service configuration, thus not requiring an administrative UI.

# Implementation Links

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
