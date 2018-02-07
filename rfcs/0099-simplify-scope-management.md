# RFC 99 - simplify scope management
* Comments: [#99](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/99)
* Initially Proposed by: @jonasfj

# Proposal
Right now we distinguish between permissions to create and update a role; and we do not have a way to let someone manage a scope.

This RFC proposes that we remove the distinction between `createRole` and `updateRole`, as well as `createClient` and `updateClient`; instead we just have `auth.declareRole` and `auth.declareClient` which only takes a description and expiration in case of client. These should require scopes:
 * `auth:manage-role:<roleId>`, and,
 * `auth:manage-client:<clientId>`, respectively.

We then define:
```js
auth.grant({
  roles: [
    {
      roleId: '...',
      add: ['scopeA', ...],
      remove: ['scopeB', ...],
    }, ...
  ],
  clients: [
    {
      clientId: '...',
      add: ['scopeA', ...],
      remove: ['scopeB', ...],
    }, ...
  ], 
});
```
In short `auth.grant` takes a diff over all scope assignments. So it never sets the scopes for a client or a role, it only specifies which scopes to add/remove. This way concurrent operations aren't going to cause issues. Furthermore, all the payloads from `auth.grant` makes up a global revision history on all scope assignments. Indeed, we could publish these payloads to pulse, as they are effectively deltas, as some monitoring service could notify when a special scope is granted...

To add a scope in `auth.grant` one of the following conditions must be true:
 1) Grant to client:
  * The scope is granted to a client
  * The caller has the scope being granted
  * The caller has the scope `auth:manage-client:<clientId>`
 2) Grant to role:
  * The scope is granted to a role
  * The caller has the scope being granted
  * The caller has the scope `auth:manage-role:<roleId>`
 3) Grant of managed scope:
  * The scope being granted is on the form `<scope>` (or `auth:manage-scope:<scope>` -- I think??)
  * The caller has `auth:manage-scope:<scope>`


Similar roles applies for removing scopes, with the possible exception that in (1) and (2) the caller does not need to posses the scope being removed.

Hence, you must either manage the modified role/client, OR you must manage the scope being granted, by having the scope:
 * `auth:manage-scope:<scope>`

Notice that the scope `auth:manage-scope:<scope>` allows you to add/remove `<scope>` from ANY role/client. Indeed it allows you to declare any role/client too, as granted/adding a scope to a role/client that doesn't exist implicitly creates it (granted you would never get accessTokens in this flow).

The motivation for `auth:manage-scope:<scope>` is to say that if you own a service like taskcluster-notify, then you should have the scope: `auth:manage-scope:notify:*`. Hence, you can add/remove any `notify:<whatever>` scope from any client/role. Without this authority how else are you supposed to protect your service. Notice, you could ofcourse also grant sub-scopes, to people, groups and repos; but if you can grant them you must also have the ability to revoke them.