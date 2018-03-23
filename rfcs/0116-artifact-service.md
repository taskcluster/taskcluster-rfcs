# RFC 116 Artifact Service
* Comments: [#116](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/116)
* Proposed by: @jhford

# Summary

Taskcluster tasks often product Artifacts during the course of being run.
Examples include browser archives, json metadata and log files.  We currently
store Artifacts in a single region of S3 and split management of Artifacts
between the Queue and Cloud Mirror.  This project is to take Artifact handling
out of the Queue and into its own service that takes over the responsibilities
for cross-region and cross-cloud replication.

The Artifact service should not be directly exposed to end users as a Rest API.
It will instead be a generalised API that the Queue uses to facilitate artifact
creation from tasks.  In other words, the Queue gates operations to the
Artifact service.  The service will be exposed to endusers by means of a `Location`
header value on a `300` series redirect.

The Queue will now store only the name of Artifacts and would treat the name of
an Artifact as an opaque identifier and defer all management of the actual
bytes to this system.  The Queue would also stop doing IP to Object store
mappings.

This RFC is to decide on what the Artifacts service is and its interface, not
implementation details

## Motivation

* We want the Queue to be easier to understand, develop and maintain
* We want Artifacts to be easier to understand, develop and maintain
* We want better Artifact handling without increasing complexity of the Queue
  codebase
* We want to have more clear responsibilities for our services
* We want to consolidate the handling of Artifacts into a single service
* We want to build generalised software when possible as participants of a free
  software community

# Details

* The Artifact service will start from the Queue's `artifacts.js` file
* Auth might not be done with scopes and tc-auth, but a shared secret between
  Queue and Artifacts
* The Queue will block new tasks after task resolution by not issuing new
  signed urls
* Data storage in Artifacts will be done with Postgres and not Azure Table
  Storage
* We do not intend to have an operation to list artifacts in the API
* The redirecting logic of the Artifact service will adhere to the HTTP spec
  using 300-series redirects where possible
* Where content-negotiation is impossible, the service will block creation of
  artifacts when incoming requests aren't compatible with required response
* We will support uploading artifacts to different regions so that we can

## API
This API is up for debate and is only an illustrative starting point.  

### Generalised request format
There will be a concept of a generalised HTTP request.  This will be an object shaped like
```javascript
{
  method: 'GET',
  url: 'https://www.example.com',
  headers: {
    'user-agent': 'taskcluster',
  }
}
```

* The body will not be included, but can be described through HTTP headers in the request
* Duplicated HTTP headers will be unsupported (i.e. key -> string not key -> list of strings)
* All query string, path, fragements are contained in a fully formed `url` property

### Creation

```
PUT /artifacts/:name
```

This endpoint will take an origin and name.  It will return a `200` with a
document which contains a list of generalised requests which could be run to
complete the actual upload.  Please see the queue's current `blob` storage type
for an example of this pattern.  The body of the request will contain metadata
about the artifact in the shape:

```javascript
{
  origin: '10.10.10.10' || 's3_us-west-2',
  contentType: 'application/json',
  contentLength: 1234,
  contentSha256: 'abcdef1234',
  transferLength: 1234,
  transferSha256: 'abcdef1234',
  contentEncdoing: 
  expiration: new Date(),
}
```

The `origin` parameter will either be an IPv4 address, IPv6 address, or an
identifier.  This parameter will specify the source location of the ultimately
originating request.  This means the origin of the request to the Queue from
the worker and not the request to the artifact service.  If the origin is an
IPv4 or IPv6, a mapping of the address and IP will occur to find the backing
storage.  If the origin is not an IPv4 or IPv6 address and is identical to a
set of known and mappable identifiers (e.g. `s3_us-west-2`), then that will be
used to map the token to find the backing storage.

### Deletetion

```
DELETE /artifacts/:name
DELETE /caches/artifacts/:name
```

Delete all copies of the named Artifact if using first endpoint.  The second
endpoint would attempt delete all of the cached copies in the various
locations.  This cache purging must return a `202 Accepted` response and not
`200/204` due to the nature of how caches work in the real world.

### Retreival

```
GET /artifacts/:name[?max_time=30]
```

This endpoint returns a 302 redirect to the location of the Artifact which is
closest to the request's IP address.  If needed, this will initiate from the
original backing store into a different storage location.  It will wait up to a
configurable amount of time before redirecting to the non-optimal original
backing store.

In order to support running in environments where requests are limted in time,
the `attempts` query string option will specify roughly how many seconds the
client is willing to wait for an artifact.  The default value should be based
on the size of the artifact.  For example, it will wait 2s for each 100MB of
artifact size.  While waiting, the service will issue intermediate redirects
to itself to reduce the waiting time.

Example inside heroku:
```
10:00:00 <-- GET /artifacts/my_file?max_time=90
10:00:25 --> 302 /artifacts/my_file?max_time=65
10:00:25 <-- GET /artifacts/my_file?max_time=65
10:00:50 --> 302 /artifacts/my_file?max_time=40
10:00:50 <-- GET /artifacts/my_file?max_time=40
10:00:55 --> 302 http://us-west-2.s3.amazonaws/artifacts/my_file
```

### Redirects and Errors
```
GET/PUT/DELETE /redirects/:name
GET/PUT/DELETE /errors/:name
```

Since redirects aren't artifacts and errors aren't artifacts, they will have
their own endpoints.  There's no reason to mix them into the same tables and
logic for the full artifacts, so we will have endpoints for their creation and
management.

For the `PUT` method of redirects, the body will look like:

```javascript
{
  url: 'https://www.google.com'
}
```

The `GET` method will redirect to the URL value from the `PUT` body

For the `PUT` method of errors, the body will look like:

```javascript
{
  reason: 'error code',
  message: 'error message'
}
```

The `GET` method will return the metadata with a `403 Forbidden` response code.


# Open Questions

* Will we move old artifacts over?
* Will we move deprecated artifact types (s3, azure) over?
* How will we support data centers where we have no native object store
* What auth scheme will we use between Queue and Artifacts
* Will we use Content Addressable storage?

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
