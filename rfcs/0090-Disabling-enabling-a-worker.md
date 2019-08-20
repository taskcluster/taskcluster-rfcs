# RFC 90 - Disabling/enabling a worker
* Comments: [#90](https://github.com/taskcluster/taskcluster-rfcs/pull/90)
* Initially Proposed by: @helfi92

# Proposal
One of the actions we want to perform on a worker is disabling/enabling it. Disabling workers allows the machine to remain alive but not accept jobs so that a user could perform diagnostics/debugging on the machine. Enabling workers on the other hand will resume accepting jobs. Presently, when claimWork is called, a worker is updated with new tasks.

I am suggesting extending the following 2 endpoints to add a `disabled` property:
```js
GET /v1/provisioners/:provisionerId/worker-types/:workerType/workers/:workerGroup/:workerId
signature: worker(provisionerId, workerType, workerGroup, workerId)
scopes:    -
response: {
  provisionerId: '...',
  workerType: '…',
  workerGroup: '...',
  workerId: '...',
  recentTasks: [...], // 20 most recent taskIds
  firstClaim: Date // date of first task claimed
  expires: Date,
  disabled: Boolean
}

PUT /v1/provisioners/:provisionerId/worker-types/:workerType/workers/:workerGroup/:workerId
signature: declareWorker(provisionerId, workerType, workerGroup, workerId)
scopes: 'queue:declare-worker:<provisionerId>/<workerType>/<workerGroup><workerId>#<property>'
request: {
  expires: Date,
  disabled: Boolean
}

response {
  provisionerId: '...',
  workerType: '…',
  workerGroup: '...',
  workerId: '...',
  recentTasks: […],
  firstClaim: Date
  expires: Date,
  disabled: Boolean
}
```

By doing that, each time claimWork is called, if a worker is disabled then we won’t update the worker. Would this be a good way to disable workers?