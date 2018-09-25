# RFC 0128 - Provide docs/standards about client/worker/proxy interactions in redeployable taskcluster
* Comments: [#128](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/128)
* Proposed by: @petemoore

# Summary

Changes are required for clients of taskcluster services when taskcluster
becomes redeployable.

This RFC serves to define the standards by which taskcluster deployments will
publish a manifest of their service definitions, how client generators will
query and interpret this manifest and associated reference and schema documents
in order to generate clients, what the architectural changes to generated
clients will be, how users of those clients (workers, worker authentication
proxies, command line tools, software libraries) will be adapted in order to
use the new clients, and how generated clients and client generators will be
built, released and deployed.

This entails changes to the way workers will share deployment / authentication
proxy configuration information with tasks, versioning of the API / Event
reference schemas, versioning of the services definitions based on those API
and Event reference schemas, and the possibility for clients to connect to
different taskcluster deployments.

## Motivation

<why do we need this?>

# Details

<how will this be implemented? what does it depend on? what are the
compatibility concerns?

# Open Questions

<what isn't decided yet? remove this section when it is empty, and then go to
the final comment phase>

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
