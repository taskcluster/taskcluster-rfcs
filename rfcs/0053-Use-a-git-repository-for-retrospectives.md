# RFC 53 - Use a git repository for retrospectives
* Comments: [#53](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/53)
* Initially Proposed by: @imbstack

# Proposal
Currently we track retrospectives in a couple ways:

1. The lightweight team internal retrospectives we sometimes do which end up in etherpads somewhere ephemeral. (get it?)
2. The heavyweight Platform Operations retrospectives in Google Docs that we've never really adopted. Now that we're not on that team anyway, it doesn't matter so much.

I propose that to replace these two processes, we have a single process in a git repository. We'll use the lightweight template we were using before to encourage more contributions. I've created an example repo at https://github.com/taskcluster/taskcluster-retrospectives. The instructions are in the README. I've created an example PR for my outage today in taskcluster/taskcluster-retrospectives#1.

---

## Proposed Process

 * incident occurs
 * someone opens up a google doc (I agree these are better than etherpad for this sort of thing)
 * everyone dumps notes, info, etc. in there
 * incident is resolved
 * someone uses the google doc to write up a retrospective document, flags one or more other participants for review on a PR
 * Once it's generally agreed to be comprehensive and accurate, someone clicks "merge".