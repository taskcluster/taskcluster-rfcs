# RFC 76 - Turn off the scheduler service
* Comments: [#76](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/76)
* Initially Proposed by: @djmitche

# Proposal
The major known user of this service is release engineering (c.f. https://bugzilla.mozilla.org/show_bug.cgi?id=1259627) and it's unclear how difficult it would be to stop using the service.

This service has not seen much love, and is likely still running in Jonas's Azure account.  If we choose not to sunset it soon, we should update it and move it to the production Azure account.
