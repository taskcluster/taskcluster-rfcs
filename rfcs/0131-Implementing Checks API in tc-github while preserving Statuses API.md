# RFC 131 - Implementing Checks API
* Comments: [#130](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/130)
* Proposed by: @djmitche, @owlishDeveloper (author of this document)

# Summary

We want to implement Checks API without dropping the support os Statuses API. Statuses API would be the default. Our users
will have the freedom to choose which API they want by indicating their choice in `.taskcluster.yml`.

## Motivation

So GitHub has come up with a new API to create status indicators in its UI, called Checks.
Checks API isn't in any way compatible with the current Statuses API - status created with one cannot be updated with another;
they are two totally separate sets of data. Calling both APIs would result in two sets of status indicators in the UI.
Any third party tools and integrations that rely on Statuses API to work would stop working after we switched to Checks API.

We want to implement Checks because it seems to be the future, and because it gives a much richer output and a whole bunch 
of controls for our users.

At the same time, we want to preserve compatibility with Statuses because some of our users use tools and integration that 
rely on them.

# Details

Currently we create a task and a status in a single function that listens
to github webhooks. The idea is to create a task in separate function that listens to webhooks and creates tasks;
then listen to the pulse message (namely, `task defined`) on a certain queue that signals about creation of a task.
The messages would go to this or that queue based on some indication in `taskcluster.yml` - like a line `reporting: 'checks-v1'`.
The presence of that indication would result in adding a route (like a path to a queue?) to the task definition.
We can also have something like `reporting: ['github-checks', 'github-statuses', 'irc://irc.mozilla.org:6667/#myproject']`
to report through various channels.

So we would have two separate listeners for `task created` event, one would create statuses using Checks API, and another 
would use Statuses API. Similarly, status updates would come in through separate channels as well, so we would have two 
separate sets of status listeners - one for updating status indicators through Statuses API, and another through Checks.

# Open Questions

I (owlish) will be implementing this. I am not familiar with the concept of routes and very vaguely familiar with the concept
of scheduler ID. I'll be going through the docs today, but if you have any relevant links - those would be greatly appreciated.

# Implementation

* [pull request](https://github.com/taskcluster/taskcluster-github/pull/278)
* [bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1459645)
