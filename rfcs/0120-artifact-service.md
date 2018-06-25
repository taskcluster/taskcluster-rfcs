# RFC 120 object Service
* Comments: [#120](https://api.github.com/repos/taskcluster/taskcluster-rfcs/issues/120)
* Proposed by: @jhford

# Summary

Taskcluster tasks often produce artifacts during the course of being run.
Examples include browser distribution archives, json metadata and log files.
We currently store artifacts in a single region of S3 and split management of
artifacts between the Queue and Cloud Mirror.  This project is to design an
object storage api which drastically simplifies the management of objects from
the Queue's perspective while at the same time handling the cross-region
replication and cache management of Cloud Mirror as well as enabling
cross-cloud support.

The object service should not be directly exposed to end users as a Rest API.
It will instead be a generalised API that the Queue uses to facilitate artifact
creation from tasks.  In other words, the Queue gates operations to the object
service.  The service will be exposed to end users by means of a `Location`
header value on a `300` series redirect or by relaying responses.

The Queue will now store only the name of objects and would treat the name of
an object as an opaque identifier and defer all management of the actual bytes
to this system.  The Queue would also stop doing IP to object store mappings.

This service coordinates the uploading and downloading of objects stored
directly from the implementation of the backing service.  This service figures
out where the best location to store an object is, provides an uploader with
the signed HTTP requests needed to upload that object and provides downloaders
the correct URL for downloading, possibly caching the object if needed.

This RFC describes the interface of the Object Service; implementations may
vary.

## Motivation

* We want the Queue to be easier to understand, develop and maintain
* We want objects to be easier to understand, develop and maintain
* We want better object handling without increasing complexity of the Queue
  codebase
* We want to have more clear responsibilities for our services
* We want to consolidate the handling of objects into a single service
* We want to build generalised software when possible as participants of a free
  software community

# Details

* Auth will not be done with scopes and tc-auth, but a shared secret between
  frontend service and objects, with JWT being a possibility
* The frontend service will block new artifacts after task resolution by not
  issuing new signed urls to this service
* We do not intend to have an operation to list objects in the API
* The redirecting logic of the object service will adhere to the HTTP spec
  using 300-series redirects where possible
* Where content-negotiation is impossible, the service will block retrieval or
  creation of objects when incoming requests aren't compatible with required
  response
* We will support uploading objects to different regions and services so that
  we can minimize inter-region transfer costs for initial object creation

### Content Negotiation
Some storage providers allow for a specific content-encoding to be set for
their resources, but do not allow for content negotiation.  An example is S3,
where you can store objects with an immutable content-encoding value of 'gzip'
at creation.  All requests will respond with "Content-Encoding: gzip"
regardless of the "Accept-Encoding" request header value.  The HTTP spec is not
100% clear on whether or not this is allowed per the spec, so we will ensure
that only definitely valid requests are processed.

In order to force only valid requests, we will require that any request which
would result in a forced content-encoding header have a corresponding
accept-encoding header.  If a request which would be forced to respond with a
"Content-Encoding: gzip" then only requests with "Accept-Encoding: gzip" (or
compatible) would succeed.  In this case a 406 Not Acceptable response would be
given.

This does not implement or intend to implement content-negotiation, instead is
a system to ensure that only requests which would've negotiated a compatible
encoding would succeed.

## API

### Generalised request format
There will be a concept of a generalised HTTP request.  These requests are used
to transmit metadata of an HTTP request which the service requires the client
to perform.

An example usage of this format is uploading a file.  The creation endpoint of
this service will generate all of the HTTP request metadata that the uploading
process will use to upload file.  Then the uploader will match these HTTP
requests with payload bodies and run each of these requests.

The motivation for this type of flow is to support the case where the uploader
is running in a different region than this service is.  If we required all
uploads to gate through this service, we'd need to duplicate uploading effort
and perform unneeded inter-region transfers.  By transmitting a list of
requests which allow the uploading to happen, we can instruct the uploader to
upload directly to the existing S3 infrastructure, but perform all signing
within this service.

A generalised request will look like:

```javascript
{
  method: 'GET',
  url: 'https://www.example.com',
  headers: {
    'user-agent': 'taskcluster',
  }
}
```

* The body will not be included, but can be described through HTTP headers in
  the request
* Duplicated HTTP headers will be unsupported (i.e. key -> string not key ->
  list of strings)
* All query string, path, fragments are contained in a fully formed `url`
  property

### Origins
Where present, the `origin` rest parameter in this service will be either an
IPv4 address, IPv6 address, or an identifier.  This parameter will specify the
source location of the ultimately originating request to upload.  If the origin
is an IPv4 or IPv6, a mapping of the address and IP will occur to find the
backing storage.  If the origin is not an IPv4 or IPv6 address and is identical
to a set of known and mappable identifiers (e.g.  `s3_us-west-2`), then that
will be used to map the token to find the backing storage provider.  If the
origin is not an IP address and not a configured identifier, an error will be
sent back to the client.

The mapping of origins to storage providers should be statically configured.

The origin `all` is reserved and cannot be used.  This is to enable management
endpoints to operate on all origins in the future.

### Creation

```
PUT /objects/:name
POST /objects/:name
```

The `PUT` endpoint will take an origin and name.  It will return a `200` with a
document that contains a list of generalised requests which could be run to
complete the actual upload.  Please see the queue's current `blob` storage type
for an example of this pattern.  The body of the request will contain metadata
about the object in the shape:

```javascript
{
  origin: '10.10.10.10' || 's3_us-west-2',
  contentType: 'application/json',
  contentLength: 2048,
  contentSha256: 'abcdef1234',
  transferLength: 2048,
  transferSha256: 'abcdef1234',
  contentEncoding: 'identity',
  expiration: new Date(),
  parts: [{
    sha256: 'efdcb111',
    size: 1024,
  }, {
    sha256: 'fbcade321',
    size: 1024,
  }],
}
```

In this body, the content headers refer to the actual document

This endpoint will return a list of HTTP requests which must all be run.

The `POST` endpoint will be sent without a request body and will be used to
perform any post-upload actions.  These include things like the commit step on
an S3 multipart upload.  This endpoint would be run by the frontend service and
not by the uploader, and the frontend service would also need a complimentary
method for workers to call when they complete the upload.  This is what is
currently done with the `blob` storage type in the queue.

The completion endpoint is used to perform any post-upload validation required.
This might include the "Complete Multipart Upload" for S3 based objects, or
possible a post-upload hash and verification step for a locally managed file
server.

Until the completion endpoint is called for a given object, attempts to
retrieve an object will result in a 404 Not Found response.

Object creation must be idempotent.  If a call to the creation end point
happens with equivalent values, the same response body must be returned.  If a
call is made to the endpoint with conflicting values, an error must be returned

Example of a multipart upload using S3 from the object service's perspective.
This is a simplified view, meant to highlight the key interactions rather than
every detail.  For the purpose of this example, the uploader speaks directly
with the object service.  In reality this interaction would have something like
the Queue as an intermediary between the uploader and the object service.

```
uploader --> objsvc PUT /objects/myobject  {
                                            origin: '10.10.10.10',
                                            contentType: 'application/json',
                                            contentLength: 2048,
                                            contentSha256: 'abcdef1234',
                                            transferLength: 2048,
                                            transferSha256: 'abcdef1234',
                                            contentEncoding: 'identity'
                                            expiration: new Date(),
                                            parts: [
                                              sha256: 'efdcb111',
                                              size: 1024,
                                            }, {
                                              sha256: 'fbcade321',
                                              size: 1024,
                                            }],
                                          }
objsvc --> s3 POST /object-myobject?uploads
objsvc <-- s3 200 UploadId=upload1
uploader <-- objsvc 200 {requests: [{
                          url: 'http://s3.com/object-myobject?partNumber=1&uploadId=upload1',
                          headers: {authorization: 'signature-request-1'},
                          method: 'PUT'
                        }, {
                          url: 'http://s3.com/object-myobject?partNumber=2&uploadId=upload1',
                          headers: {authorization: 'signature-request-1'},
                          method: 'PUT'
                        }
                       ]}
uploader --> s3 PUT /object-myobject?partNumber=1&uploadId=upload1'
uploader <-- s3 200 ETag {etag: 'Opaque-Etag-From-S3-1'}
uploader --> s3 PUT /object-myobject?partNumber=2&uploadId=upload1'
uploader <-- s3 200 ETag {etag: 'Opaque-Etag-From-S3-2'}
uploader --> objsvc POST /objects/myobject {etags: ['Opaque-Etag-From-S3-1',
                                                    'Opaque-Etag-From-S3-2']}
objsvc --> s3 POST /object-myobject?uploadId=upload1 {etags: [
                                                    'Opaque-Etag-From-S3-1',
                                                    'Opaque-Etag-From-S3-2']}
objsvc <-- s3 200 ETag {etag: 'Opaque-Etag-For-Completed-Object'}
uploader <-- objsvc 200
```

*Note*: The etags in this example are opaque, generated by S3's servers and
must be passed verbatim.

#### Part Size for Multipart Uploads
Many object storage systems offer the option to perform multipart uploads.
This is done to enable parallel uploads as well as enabling files which are
larger than any single HTTP request ought to be.  For example, Amazon S3 limits
object creation requests to be no greater than 5GB.  In order to upload 10GB,
you must use a multipart upload.

One source of complexity here is that the uploader needs to know what part size
they should be using.  We will document that the suggested part size is 64MB.
This will be a part size which we will do our best to support in all cases.

In the case that a backing service does not support using 64MB parts, or the
user provides a custom part size which is not supported by the backing service,
we will respond to the `PUT` request with a 400-series error along with a JSON
error message that provides information on part sizes which will work.  The
uploader should store a copy of this information to inform future uploads.

### Deletion

```
DELETE /objects/:name
```

This service has at least one copy of each stored file.  Any copies stored in
addition to this original and authoritative copy are considered to be cached
copies.

This endpoint will delete the original copy of the file as well as initiating
the deletion of any cached copies.  On success, it will return a 200-series
responseto reflect the success of deleting the original copy.

### Retrieval

```
GET /objects/:name[?max_time=30][&origin=s3_us-west-2]
```

This endpoint returns a 302 redirect to the location of the object which is
closest to the request's IP address.  If needed, this will initiate a copy from
the original backing store into a different storage location.  It will wait up
to a configurable amount of time before redirecting to a non-optimal copy.

In order to support running in environments where requests are limited in time,
the `max_time` query string option will specify roughly how many seconds the
client is willing to wait for an object.  The default value should be based on
the size of the object.  For example, it will wait 2s for each 100MB of object
size.  While waiting, the service will issue intermediate redirects to itself
to reduce the waiting time.

In the case that someone wishes to specify a specific origin for the request,
as a request to override the automatic IP resolution, the optional
`origin=<origin>` query parameter can be used.

An object must not be viewable until any post-upload steps which are required
have occurred.  This is to ensure that objects which have not been fully
completed or had their validation completed are used

Example inside heroku:
```
10:00:00 <-- GET /objects/my_file?max_time=90
10:00:25 --> 302 /objects/my_file?max_time=65
10:00:25 <-- GET /objects/my_file?max_time=65
10:00:50 --> 302 /objects/my_file?max_time=40
10:00:50 <-- GET /objects/my_file?max_time=40
10:00:55 --> 302 http://us-west-2.s3.amazonaws/objects/my_file
```

The origin id chosen by the system will be stored in an HTTP header
`X-ObjSvc-Cache-Id`

### Cache Management
```
GET /caches/
GET /caches/:id/objects/:name
DELETE /caches/:id/objects/:name
```

These endpoints are not intended to be used by general users of this service.
They are present for maintenance and debugging of the operators.

The first endpoint will list out the cache identifiers which are configured by
the system.  They will correspond to the same value as the `origin` for that
specific cache location.

The second endpoint would be used to retrieve an object directly from a
specific cache, skipping the canonical location.  This endpoint would function
otherwise identically to the normal retrieval endpoint, except that it will
return a 404 error if the item is not yet present in the cache.  It will not
initiate a copy of the object into the cache.

The third endpoint will initiate a deletion of the copy stored in that cache,
leaving the original file intact.  The cached copies are those copies which are
created in other regions or services to provide more local copies of each
object.  This cache purging must return a `202 Accepted` response when purging
of the cache cannot be completed by the time the response is sent.  If the
cache is able to purge the object and verify that the purge is complete, a `200
OK` response is appropriate.

In order to purge all caches, a special reserved cache id `all` would be used
that purges all non-canonical copies of the object.  This also implies that the
origin `all` is also reserved

# Expiration
The `expiration` parameter of an object is used to specify when an object
should no longer be accessible for retrieval.  This parameter should also be
used by the service to automatically purge canonical copies which have exceeded
their expiration time.  The service should use backing service provided
mechanisms for object expiration wherever possible.  Whatever system is used to
delete expired artifacts must ensure that the object is removed no earlier than
the expiration time.

An object which is past its expiration should return a response equivalent to
the error not being there at all.  In order to prevent name reuse, the object
name will continue to exist as a delete marker to block a new object from
reusing a name.  Deleting an object which has expired will clear this delete
marker.

# Security
This service will use [JWT](https://tools.ietf.org/html/rfc7519) (Json Web
Tokens) for authentication and authorization.  Each request to this service
will include a token which includes information about which resource is being
checked and which action it is allowed for.  These tokens will be for specific
resources and operations.  The resources will be addressed using the terms of
this API, rather than signing a URL.  The authentication scheme will use
HMAC-SHA256 with a shared secret initially, but we will consider supporting
stronger algorithms.

We will support the token being provided either as a `token` query string
parameter or as the value of the `Authentication` header.  Having both header
and query string parameter specified is an error if they are not exactly equal
bytes.  We will check for equality and not equivalence.

The exact structure of the tokens is not formalized in this document, beyond
that they will be per-resource, will have specific permissions, and will work
in terms of this API and not as signed urls.

# Open Questions

* Will we move old artifacts over? **No**
* Will we move deprecated artifact types (s3, azure) over? **No**
* How will we support data centers where we have no native object store:
  * We will support pull-through caches the same way we support CDNs by redirecting
    urls.  These might be signed urls, as required by each underlying storage system
  * We will look into Ceph or similar systems
* What auth scheme will we use between Queue and objects? **JWT with HS256**
* Will we use Content Addressable storage? **No**
  * ~~We like this idea, but we're going to do thinking about it later on since
    it's not required that we tackle this upfront~~
  * We think this is neat, but the potential benefit is perceived to be too
    small for the possible security risks

# Implementation

<once the RFC is decided, these links will provide readers a way to track the
implementation through to completion>

* <link to tracker bug, issue, etc.>
* <...>
