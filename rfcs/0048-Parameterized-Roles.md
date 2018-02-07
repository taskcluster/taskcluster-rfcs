# RFC 48 - Parameterized Roles
* Comments: [#48](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/48)
* Initially Proposed by: @djmitche

# Proposal
Parameterized roles would let us be a bit more expressive in role definitions.

Role `project-admin:%` would expand to
* `auth:create-client:project/%/*`
* `auth:reset-access-token:project/%/*`
* etc.

With the added hack that: `'project-admin:*'` -> `['auth:create-client:project/*, ...']` i.e., drop trailing slashes.  In general, the % would have to be the last character in the role.

This would drastically reduce the number of formulaic roles we have.