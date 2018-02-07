# Mechanics

So, how do I use this?

## I Have an Idea!

Open an issue! Issues should either be more than a week's work, or potentially controversial.  Anything else can just be filed as a bug (assigned to yourself, of course).

Ideas should have
 * a pretty specific goal: a user story ("Users can..."), dependency ("This will allow ..") or a completion condition ("All services .."); and
 * some vague idea of how this might be accomplished, or a few alternatives.

You can leave the issue un-assigned, or assign it to yourself if you intend to champion it.
Shop the issue around to the team to try to get a diversity of opinions on it.
It's OK to leave ideas open indefinitely, awaiting their time.

## I Have an Opinion!

Comment on the issue.
The issues are intended to record the discussion on the idea, so that's the right place.

As decisions are made, the assignee will update the first comment to represent that consensus.

## Let's Decide!

### Write a Proposal

* Copy `[template.txt](template.txt)` to `rfcs/1234-rfc-title.md` where `1234` is
  the issue number (padded to four digits with zeroes).  Edit the file to fill in
  the necessary information, including the issue number, and commit it to a
  branch.

* Next, use the [issue2pr app](http://issue2pr.herokuapp.com/) or the [git
  extension](https://github.com/djmitche/git-issue2pr) to convert your issue into
  a pull request with the same number.  Pretty neat!

* Finally, label it `Phase: Proposal`.

### Request Comments

Now get anybody you know will care about this on-board quickly by contacting
them by whatever means you want: irc, email, @ mentions should all work well.
As early as possible, get an email out to the tools-tc list if this is going to
be something more than a couple specific people care about. Use your best
judgement.  Give a few days for opinions to filter in. Respond promptly if
possible to avoid a confusing conversation but give enough time for people who
are PTO or busy etc.  The idea here is to work out any disagreement and come to
a proposal everyone can live with, so modify the proposal as necessary using
the usual git tools.  Reaching consensus is unlikely, but compromise is always
possible.

### Final Comments

When the open questions have been answered and you feel that everyone is on the
same page, it's time for the final-comment period.  The intent of this phase is
to allow someone to speak up and say, "uh, no, that's not what I thought we
decided as a group" or "I wasn't aware of this proposal, that's crazy", so
notification should be distributed broadly.  The phase should last long enough
for everyone to read the summary and speak up, taking into account timezones,
PTO, and email backlogs - use your best judgement.

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
