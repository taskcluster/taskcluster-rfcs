# RFC 66 - Allow hooks to be triggered by pulse messages
* Comments: [#66](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/66)
* Initially Proposed by: @djmitche

# Summary

It should be possible to configure a hook to fire when a pulse message on a given exhcange and with a given routing key is received.

# Details

Each hook would have a configuration listing (exchange, routingPattern) pairs.
When a matching message is received on pulse, the hook would be fired, given
the pulse message as part of the
[JSON-e](https://github.com/taskcluster/json-e) context.

# Implementation

* tracker: https://bugzilla.mozilla.org/show_bug.cgi?id=1225243
