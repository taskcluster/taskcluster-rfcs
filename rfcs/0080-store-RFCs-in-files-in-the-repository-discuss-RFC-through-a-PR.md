# RFC 80 - store RFCs in files in the repository, discuss RFC through a PR
* Comments: [#80](https://github.com/taskcluster/taskcluster-rfcs/pull/80)
* Initially Proposed by: @jhford

# Proposal
Right now, each RFC is a github issue.  There are the following drawbacks

1. The discussion of the issue and the content of the proposal are interspersed.
1. Without building tooling, there's no way to amend the proposal in a way which preserves correct attribution
1. It would be very difficult to move this system to another repository or hose

The proposal is that we:

1. Create directory `rfcs` and `archived-rfcs` in the repository
1. For each proposal, open a Pull Request.
1. Each pull request would have a single file `rfcs/YYYY-MM-summary.txt`
1. Discussion would happen in the Pull Request
1. Edits to the proposal would be made when there's consensus to make the edit
1. A proposal which we want to adopt gets merged and a proposal which we will not adopt would be closed without merging

The benefit to this approach is that we have full attribution, we separate discussion of the proposal from a clear, refined vision of the proposal.  During the discussion, those who are only interested in the outcome could see very clearly what has changed, by seeing new commits on the PR and by looking at only the diffs.

Because we'd be doing merges, we'd also be able to see how each individual RFC has progressed.

Since pull requests are a superset of issues, we should be able to keep all the other labels, projects processes intact.