# RFC 114 - Abuse protection for RabbitMQ server and tc-events.md
* Comments: [#114](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/114)
* Proposed by: @Biboswan

# Summary

1: limit connection attempt rate to tc-events(frequent opening and closing connection => higher CPU utilization)

2: Use maxLength, Prefetch properties for queues (Memory limit)

3:Using memory and cpu alarm apis (https://www.cloudamqp.com/docs/api-alarms.html)
Our rabbitmq server is accessed by other ways as well.Hence this will give us a better understanding of the rabbitmq server for tc-events to act accordingly.

4: Disable lazy queues. Yes if incoming message rate is quite high in comparison to consumption rate then better to enable lazy queues. Just some thoughts if some optimization mid way possible

## Motivation

rfc-0104

# Details

Nothing in Taskcluster currently assumes that it is using CloudAMQP. Therefore  If we do, it would need to be done in a way where it could be easily disabled. Since taskcluster can be used by some other organization as well where they don't use CloudAMQP

# Open Questions

# Implementation

TBD
