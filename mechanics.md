# Mechanics

So, how do I use this?

## I Have an Idea!

We've learned that ideas should be developed outside of the RFC process first.
Create a document in another context and talk it through with the relevant people.
Keep iterating until there is one option that has rough agreement from those people.
It's OK if some details are still unclear.

A symptom of rushing this phase is an enormous list of comments on the RFC pull request.
This is usually difficult to follow and communications issues quickly swamp the process.
If this occurs, return to the idea phase.

## I Think We Have Rough Consensus!

By this time you should have:

 * a pretty specific goal: a user story ("Users can..."), dependency ("This will allow ..") or a completion condition ("All services ..");
 * a pretty solid idea of the solution; and
 * tentative agreement from most of the people concerned.

It's time to make an RFC!

* Copy [`template.txt`](template.txt) to `rfcs/xxxx-<rfc-title>.md`.
  Be as detailed as possible.
  If there are open questions, answer them before proceeding.
  Commit it to a branch, push, and make a *draft* pull request.

* Once you have the pull request number, modify the filename to include it (`rfcs/<number>-<rfc-title>.md`).
  Replace `<number>` in the file with the PR number as well.
  Run `maketoc.py` to update the READMEs.
  Push again, and mark the PR as ready for review, and add the label `Phase: Proposal` to the PR.

* Champion the RFC.

  Get anybody you know will care about this on-board quickly by contacting them
  by whatever means you want: irc, email, @ mentions should all work well.  As
  early as possible, get an email out to the tools-tc list if this is going to
  be something more than a couple specific people care about. Use your best
  judgement.  Give a few days for opinions to filter in. Respond promptly if
  possible to avoid a confusing conversation but give enough time for people
  who are PTO or busy etc.

  The idea here is to work out any disagreement and come to a proposal everyone
  can live with, so modify the proposal as necessary using the usual git tools.
  Reaching consensus is unlikely, but compromise is always possible.

## I Have an Opinion!

Comment on the pull request.
The Github comments are intended to record the discussion on the idea, so that's the right place.

As the discussion evolves, the champion will update the Markdown file to match.

## Let's Decide!

When you feel that everyone is on the
same page, it's time for the final-comment period.  The intent of this phase is
to allow someone to speak up and say, "uh, no, that's not what I thought we
decided as a group" or "I wasn't aware of this proposal, that's crazy", so
notification should be distributed broadly.  The phase should last long enough
for everyone to read the summary and speak up, taking into account timezones,
PTO, and email backlogs - use your best judgement.  This should be at least 24
hours so that everyone has working-hours to think and respond.  A week is typical.

Update the issue's label to `Phase: Final Comment` and send a note summarizing
the proposal and indicating the duration for comments to the tools-taskcluster
list, or to some other appropriate venue.

When the final comment period has expired, if there have been no objections,
mark the issue as `Phase: Decided`, file a tracker bug and update the
*Implementation* section to point to it, and click "Merge".  Note that it's OK
to have decided RFCs which aren't being actively worked on - comment in the
tracker and close it, if necessary.

# Labels

Labelling issues helps others find them

* `good-student-project` -- something good for GSoC, Outreachy, an intern, or a committed contributor

# Milestones

We use milestones to sort ideas based on when we would like to implement them.
This isn't a commitment, or a work-tracking system -- just a way to get a picture of "now" vs. "later".
