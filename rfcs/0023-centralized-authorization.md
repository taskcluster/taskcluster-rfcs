# RFC 23 - Check for authorization without returning a full set of expanded scopes
* Comments: [#23](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/23)
* Proposed by: @imbstack

# Summary

This has two parts. First is that we use something we've called `scope expressions`
rather than nested arrays to specify scope requirements. Second is that we make
the taskcluster-auth service responsible for _authorization_ in addition to its
current _authentication_ role.

Scope expressions have already been implemented and are in use in the majority
of our services. The remainder of this document is to discuss moving authorization
into the auth service.

## Motivation

There are two major motivations:

1. The current way we handle this is inefficient. This is especially true for when
a client is granted a large amount of scopes.
2. It is easier to audit authorization when it all takes place in one place. This includes
inspecting the code for defects and generating audit logs that know exactly what
was allowed.

# Details

Currently authorization works as follows:

1. A request is received by a service `A`. Service `A` knows from api definitions whether or
not the requested endpoint requires scopes. If it does, service `A` uses the auth services
api to authenticate the request and get back a list of scopes the client possesses.
2. Service `A` compares the list of scopes to the scope expression for the requested endpoint
and determines whether the request is allowed to continue. This takes place automatically for
certain classes of requests and must take place manually via `req.authorize()` otherwise.

If we adopt this RFC, a roughly equivalent process will take place but instead of auth sending a list
of scopes to service `A`, that service will send the scope expression to the auth service. This is
generally a much smaller payload and also allows auth to know and log when requests have been authorized.

# Open Questions

I believe there are none left.

# Implementation

* https://bugzilla.mozilla.org/show_bug.cgi?id=1346013
