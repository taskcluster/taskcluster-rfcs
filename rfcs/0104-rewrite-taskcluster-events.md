# RFC 104 - rewrite taskcluster-events with a proper read-only RabbitMQ / websocket proxy
* Comments: [#104](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/104)
* Proposed by: @jonasfj

# Summary

Rewrite taskcluster-events to support:
 * well documented protocol JSON for listening over websocket
 * one RabbitMQ channel/queue per websocket connection,
 * bind/unbind to exchanges
 * resume/pause
 * automatic reconnection
 * better abuse protection
  

## Motivation

 * taskcluster-tools
 * pulse-inspector
 * possibly CLI tools

# Details

Compatibility will be broken, client side listener will likely need to have compatibility with existing `WebListener` to make migration easier.
A new client may be implemented too.

# Open Questions

Final design will be specified in GSoC propsol.

