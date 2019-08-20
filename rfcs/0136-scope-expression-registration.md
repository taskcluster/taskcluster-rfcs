# RFC 136 - Scope Expression Registration
* Comments: [#136](https://github.com/taskcluster/taskcluster-rfcs/pull/136)
* Proposed by: @imbstack

# Summary

We should build a way that a cluster admin can know what a set of scopes allows within
the Taskcluster platform. We should publish this information so that others can build tools/tests
on top of this.

## Motivation

It is currently possible to figure some subset of this out with some background knowledge of the
platform and docs/code reading, but is in general too difficult. In addition, there are
workers/services that do not ever publish a machine readable version of the scopes that they use
for access control, making this task yet more difficult.

This issue could be partially solved just by building easier ways for services/workers to publish docs
but it will provide no guarantee that any docs published this way are valid or current. We
should build a system that allows for these to be positively asserted.

Protecting the registration system by scopes and making it the only way to do authorization allows
a cluster admin to pick and choose which services will interact with their cluster and also allow
them to know at any given time which services exist in their cluster.

In addition, this will have the benefits of moving us to doing authorization in the auth service and
ensure that this move is performant as this will drastically reduce the amount of bits we need to
shovel back and forth over the wire than would be true otherwise.

# Details

We will define the following:

* **scope expression:** A way of building complex assertions from basic scopes. This is currently defined
  in taskcluster-lib-scopes. It will need to be standardized more generally for this to be an external api.
* **scope expression template:** A method of building a scope expression given certain parameters. Until
  the parameters are substituted, this is not a valid scope expression that we can use for authorization.
  This includes parameters like `<this>` and also `for` and `if`.
* **term:** One of the parameters of a scope expression template. These are called terms when they have
  additional metadata provided to allow for useful documentation and inspection.
* **operation:** Some functionality that is protected by scopes and requires authorization to perform. In a
  service, these map exactly to the list of endpoints. In a worker, there is only one operation and it is
  executing a task.
* **relying party:** An entity that attaches meaning to scopes. This can be a service, worker, or other entity
  that might want to authorize an operation or assign scopes. (i.e. taskcluster-github
  is a relying party by both authorizing some operations based on scopes that begin with "github" and also giving
  "repo" scopes to tasks.
* **scope namespace:** A prefix of scope strings that is owned by a relying party
* **operation namespace:** A prefix of operations performed by a single relying party

This scope expression template registration will be implemented roughly as follows (skip to end for example):

1. We will add a new field to our service api definitions at all of the cluster, service, and endpoint levels
   that allows us to define terms at their most appropriate level. No overriding will be permitted and each
   term must be defined with both human language documentation and a regex defining valid values for parameters
   submitted for these terms.
1. Auth service will grow a `register()` endpoint that will allow a relying party to upload structured documentation
   of its own operations to the auth service. Each operation will be within the operation namespace granted to the
   relying party, and the relying party must have a corresponding scope to complete the registration.
   For instance, only taskcluster-github will be allowed to register the `github.createStatus` operation.
   This operation will have associated metadata including the scope expression template that guards it.
   This registration must be versioned and have an expiration date. Registration will return an unforgeable token.
1. Auth service will grow an `authorize()` endpoint that will take as input an operation, a clientId, and a set of
   parameters that will be substituted into the operation's scope expression template in order to turn it into a
   scope expression. The endpoint will return a simple yes/no answer as to whether or not the clientId in question
   has sufficient scopes to satisfy the scope expression with those parameters. Either this endpoint or another one
   must still support sending a set of scopes, rather than just a clientId in order to support workers checking
   the scopes field of tasks.
1. Update all of our worker implementations (generic worker and script worker) to register their operation somehow.
   Each worker will be represented by a single operation whose scope expression has many `if` statements for each
   feature the worker supports. I expect that worker-manager will actually register these with auth to avoid
   over-calling auth service. I think we can do this by making worker implementation part of the definition of a
   workerType and having worker implementations generate the data that must be entered into the workerType definition.
1. Build a library that supports all of this querying in multiple languages along with a specification.yml so that
   others can either use our services to reason about these or run locally.
1. Build into the auth service a way to query all registered scope expression templates. The input will be a set of
   scopes. The output will be a set of operations that may be authorized by these scopes and for each of these operations,
   a list of possible values for parameters. This is a bit difficult to understand but the example should make this
   more clear.

# Example

We create a new service called `taskcluster-dishwasher`. It washes dishes and has a single operation called
`dishwasher.wash`. This operation is protected by a scope expression template:

```json
{
  "AllOf": [
    "dishwasher:wash:<detergent>"
  ]
}
```

The service will also define the term `detergent` with a bit of text about different values that might
be present and also a regex that defines valid values for `detergent`.

Before the service is started, when the cluster admin creates a client for this service, they will
ensure that it has the scope `auth:register:dishwasher.*`. When the service is started, it will register
this operation and the associated terms with the auth service.

Now the cluster admin would like to allow some users to use this service. They use either the tools site
or ci-admin to add some scopes to roles. Before they do this however, they can use the built-in support
in both of these tools for querying the auth service to see what the scopes they are giving out authorize.

Because the auth service now has global knowledge of the scopes that control which operations, it can reliably
tell you that for instance:

* Giving a client the scope `dishwasher:*` allows them to call `dishwasher.wash` with _any_ detergent.
* Giving a client the scope `dishwasher:wash:ajax-*` allows them to call `dishwasher.wash` with any
  detergent that begins with `ajax-`.
* Given a client the scope `dishwasher:wash:comet` allows them to call `dishwasher.wash` but only with the
  detergent `comet`.
* If a client does not have any `dishwasher` scopes, we know that they cannot do anything with the
  dishwashing service.

This would work similarly for workers. It can even be helpful if we just register relying parties as owning
a specific scope namespace as we can tell roughly what a given set of scopes permits -- although with
significantly less granularity.

# Open Questions

This does require auth to be running for any other service to start. Maybe we can be smart by retrying
registration until auth is running or just always checking to see if auth has the most recent version
of the definition every time we call `authorize()`?

# Implementation

* [Bug 1524341](https://bugzilla.mozilla.org/show_bug.cgi?id=1524341)
