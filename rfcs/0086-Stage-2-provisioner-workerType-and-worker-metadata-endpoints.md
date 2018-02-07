# RFC 86 - Stage 2: provisioner, workerType, and worker metadata endpoints
* Comments: [#86](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/86)
* Initially Proposed by: @helfi92

# Proposal
I'd like us to come to a consensus about the metadata endpoint discussed previously, namely Stage 2.

Copied from [#82 Comment](https://github.com/taskcluster/taskcluster-rfcs/issues/82#issuecomment-315177265):

Stage 2
--------
This would involve allowing creation of supplementary metadata for a given `provisionerId:workerType`.  Adding this supplementary metadata would be seen as purely optional.  Those worker types which have metadata would be considered 'stickier' because of the added effort, we would include them in the apis noted in Stage 1 above for 30 days instead of only 5 days.

A point of clarification is that a worker type would *not* be included in the stage 1 endpoint responses *unless* it had been seen in the wild within the last 30 days.  This means that even a worker type with metadata would not be returned in the list unless it had been seen in the last 30 days.  The purpose of this is to ensure that worker types which have gone extinct don't clutter up our dashboard.

The following endpoints would be added:

- `PUT /provisioners/:provisionerId/worker-types/:workerTypes/metadata`.  This would add metadata for a provisioner/workerType regardless of whether it has been seen.   with a document in a format which has not been defined, but could be like:
```javascript
{
  payloadSchema,
  documentation,
}
```
- `DELETE /provisioners/:provisionerId/worker-types/:workerTypes/metadata`
- `GET /provisioners/:provisionerId/worker-types/:workerTypes/metadata`

Stage 2 is one possible way that we could solve some of the requirement to have payload schema and documentation more available.
