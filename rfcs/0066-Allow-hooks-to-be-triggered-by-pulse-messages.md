# RFC 66 - Allow hooks to be triggered by pulse messages
* Comments: [#66](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/66)
* Initially Proposed by: @djmitche

# Proposal
Each hook would have a configuration listing (exchange, routingPattern) pairs. When a matching message is received on pulse, the hook would be fired, given the pulse message as part of the [JSON-e](https://github.com/taskcluster/json-e) context.