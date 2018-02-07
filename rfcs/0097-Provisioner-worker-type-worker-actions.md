# RFC 97 - Provisioner, worker-type & worker actions
* Comments: [#97](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/97)
* Initially Proposed by: @helfi92

# Proposal
To implement actions, the proposal is:

Each provisioner, worker-type and worker will have an added property defined as such:

```
actions: [
  {
    label: ‘…’, // short names for things like logging/error messages
    title: ‘…’, // Appropriate title for any sort of Modal prompt
    context: ‘provisioner|worker-type|worker’,
    url: 'https://hardware-provisioner.mozilla-releng.net/v1/power-cycle/:provisionerId:/:workerType/:workerGroup/:workerId',
    description: `...` // markdown
  }
]
```

Actions have a "context" that is one of provisioner, worker-type, or worker, indicating which it applies to (so this action would appear in a menu for a specific worker). Actions can be defined at any context higher than or at the action's level -- so a worker type or provisioner can have actions with level=worker. This should avoid unnecessary duplication of actions.

For the following `GET` URLs:

```
/provisioners/:provisionerId
/provisioners/:provisionerId/worker-types/:workerType
/provisioners/:provisionerId/worker-types/:workerType/workers/:workerGroup/:workerId
```
, we would have the following response:

```
signature: // same as before
scopes: // same as before
response: {
    actions: [
        {
            label: ‘…’, // short names for things like logging/error messages
            title: ‘…’, // Appropriate title for any sort of Modal prompt
            context: ‘provisioner|worker-type|worker’,
            url: '...',
            description: `...` // markdown
        }
    ],
    … // same as before
}
```

Then whenever someone performs an action, we take the action URL and make a post request signed with the user's TC credentials and it's up to them to interpret that.

It is worth noting that if there are 2 similar actions defined in different levels for example, we will show all and let the user pick which one they want. Taking the lowest-level action might be a security issue.

To add actions, they would call `declareProvisioner`, `declareWorkerType`, `declareWorker` and if they  have sufficient scopes, the action will be added.