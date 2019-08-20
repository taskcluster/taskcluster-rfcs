# RFC 76 - Turn off the scheduler service
* Comments: [#76](https://github.com/taskcluster/taskcluster-rfcs/pull/76)
* Initially Proposed by: @djmitche

# Summary

The scheduler service has been deprecated for a long time.
Let's turn it off.

# Details

The major known user of this service is release engineering (c.f. https://bugzilla.mozilla.org/show_bug.cgi?id=1259627) and it's unclear how difficult it would be to stop using the service.

# Implementation

Tracker: https://bugzilla.mozilla.org/show_bug.cgi?id=1399437
