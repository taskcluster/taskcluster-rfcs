# RFC 0135 - Clients and Environment Variables
* Comments: [#135](https://api.github.com/repos/taskcluster/taskcluster-rfcs/pulls/135)
* Proposed by: @djmitche

# Summary

Client libraries should not automatically read environment variables.

## Motivation

Some client libraries currently automatically use environment variables
 * `TASKCLUSTER_CLIENT_ID`
 * `TASKCLUSTER_ACCESS_TOKEN`
 * `TASKCLUSTER_CERTIFICATE`
 * `TASKCLUSTER_ROOT_URL`
if they are set, and if no explicit configuration is given when constructing the client.
But clients differ in their use of these variables.

This is problematic because not all code will want to configure settings based on
environment variables, for example workers that take their configuration from
configuration files.

This has also caused issues with testing and deploying software, where the
"hidden" context of environment variables can cause tests to pass or fail, or a
service to fail when deployed in a different context.

Finally, we should strive for some similarity in usage of the client libraries.

# Details

The proposed change is that client libraries do not *automatically* look to
these four environment variables for configuration.  The libraries would still have
options to explicitly "opt in" to using the environment variables, e.g.,

```go
queue := queue.NewFromEnvVars()
```

or

```js
queue = new taskcluster.Queue({fromEnvVars: true});
```

## Standardized Variables

This RFC also serves to standardize the meanings of the following environment variables.
These meanings capture the current *de facto* meanings.

 * `TASKCLUSTER_CLIENT_ID` - the `clientId` for API requests
 * `TASKCLUSTER_ACCESS_TOKEN` - the corresponding `accessToken` for API requests
 * `TASKCLUSTER_CERTIFICATE` - if present, a JSON-formatted temporary credential certificate.  In this case, `TASKCLUSTER_CLIENT_ID` and `TASKCLUSTER_ACCESS_TOKEN` are defined as described in [the temporary credentials documentation](https://docs.taskcluster.net/docs/manual/design/apis/hawk/temporary-credentials).  NOTE: users are not expected to decode this string.
 * `TASKCLUSTER_ROOT_URL` - the root URL of the cluster to which API requests should be made
 * `TASKCLUSTER_PROXY_URL` - if present, the root URL of a `taskcluster-proxy` instance suitable for accessing the Taskcluster deployment in which the current task is running (defined in [RFC 0128](https://github.com/taskcluster/taskcluster-rfcs/blob/master/rfcs/0128-redeployable-clients.md))

## Taskcluster-CLI

The `taskcluster-cli` application is often referred to as a "shell client library".
However, environment variables are a common and accepted way of sending configuration to command-line tools, so `taskcluster-cli` will continue to use these environment variables for its configuration.

# Current Status

## Python

The Python client currently accepts all four environment variables mentioned above, as well as a `rootUrl` option to the class constructor.
This was released in version 5.0.0.

## JS

The JS client currently accepts all four environment variables mentioned above, as well as a `rootUrl` option to the class constructor.
This was released in version 10.0.0.

## Go

The Go client does not read environment variables directly and does not support root URLs at all.
(That is, it is already compliant with this RFC)

## Java

The Java client does not read environment variables directly and does not support root URLs at all.
(That is, it is already compliant with this RFC)

## Web

The Web client runs in a browser, and therefore does not accept environment variables at all.
It does accept a `rootUrl` option similar to the JS client.

# Compatibility

This is a breaking change, necessitating a major version bump for the Python and JS clients.

RFC 0128 adds the requirement to specify a root URL, with no default available.
Because failing to specify a root URL is a fatal error, any use of clients that are not upgraded to supply explicit configuration or use `NewFromEnvVars` will likely fail clearly in testing.
Such clear failures should ease the task of upgrading client consumers, assuming good test coverage.

However, many consumers have already been updated to use the newest versions of these clients.
Such upgraded consumers may encounter subtle issues where a client continues to work for read-only operations, but fails (perhaps only in production) for operations requiring credentials.
Thus, the upgrade from 5.x (for Python) or 10.x (for JS) will require some caution.

# Implementation

TBD
