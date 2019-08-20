# RFC 7 - New Artifact API
* Comments: [#7](https://github.com/taskcluster/taskcluster-rfcs/pull/7)
* Initially Proposed by: @djmitche

# Proposal
A new artifact API is being implemented which will have the following advantages over the existing API:

- SHA256 validation of artifacts being uploaded -- nothing transfered to S3 will succeed if it does not match the SHA256 checksum computed before upload.  This ensures that nothing invalid gets into S3 itself.
- SHA256 metadata will be set on objects stored in S3 so that things downloading these objects can optionally check that the thing that they downloaded matches the values we expect and store in Azure and S3 metadata
- We will no longer send the `artifactCompleted` messages until the artifact is actually completed
- We will not be able to mark a task as completed until all artifacts declared in that task are also marked as completed.

This is mostly implemented.  The outstanding work is:
- [ ] finish review of Queue changes to add new API -- https://github.com/taskcluster/taskcluster-queue/pull/159
- [ ] use the new Boolean Entities column type
- [ ] write a taskcluster-lib-artifact in Node.js for use in Docker-Worker for uploading and downloading artifacts
- [ ] write a go library for uploading and downloading artifacts
- [ ] check that all artifacts associated with a task are marked as `present` before completing the task