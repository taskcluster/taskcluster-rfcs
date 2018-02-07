# RFC 82 - Users should be able to administer workers across provisioner boundaries
* Comments: [#82](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/82)
* Initially Proposed by: @gregarndt

# Proposal
Users do not have a general way of administering worker types and workers across provisioner boundaries (some do not even have an actual provisioner).

For AWS provisioned workers, users can see some data about that worker type such as pending counts and instances running for a given worker type.  However information specific to each of those specific instances, as well as some general information for a worker type (failure rate, etc) is not available.

Also, given that this UI is specific to the AWS provisioner, this means that any worker will need to have a provisioner that could provide this information as well as another UI to display them.

This RFC is suggesting a few things (all through one common UI):
1. users should be able to display worker types (along with relevant information) across all provisioner IDs known to taskcluster
2. users should be able to drill down to display details about a specific worker (uptime, last claim, failure rate)
3. users should be able to perform actions against those specific workers (reboot, kill, disable)
4. workers that are disabled will remain alive but no tasks will be returned by taskcluster when the worker calls claimWork.  Optionally, the worker could respond to a specific 4xx status code returned by taskcluster to know that it has been disabled.  Disabling workers specifically allows the machine to remain alive but not accepting jobs so a user can perform diagnostics/debugging on the machine
5. rebooting a machine is particularly useful for physical machines that are not killed, but rather need to be rebooted because some way they got stuck.  This might mean the machine is powered off/on again in the case of a machine hooked up to a PDU we can speak to, or it might mean it's actually rebooted through some API