# Video upload and HLS delivery setup

The website now uploads video parts directly to Backblaze B2. The video service
uses BullMQ/Redis to validate, transcode and publish HLS renditions. Keep the
legacy multipart endpoint available for existing clients.

## Required configuration

The video-service environment needs:

- `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, and `B2_BUCKET_NAME`
- `B2_SOURCE_BUCKET_NAME` for a separate source bucket (optional; defaults to
  `B2_BUCKET_NAME`)
- `B2_SOURCE_APPLICATION_KEY_ID` and `B2_SOURCE_APPLICATION_KEY` when the
  source bucket differs from the delivery bucket
- `B2_S3_ENDPOINT`, such as `https://s3.us-east-005.backblazeb2.com` (optional;
  defaults to the `us-east-005` endpoint)
- `B2_REGION`, matching the S3 endpoint (optional; normally inferred)
- `B2_PUBLIC_BASE_URL`, the public or CDN URL prefix for objects in the bucket
  (optional; defaults to the Backblaze download URL)
- `REDIS_URL` and `REDIS_PASSWORD`
- `FFMPEG_PATH` only when `ffmpeg` is not on `PATH`
- `MAX_VIDEO_UPLOAD_BYTES` to override the 10 GiB default upload limit

The delivery key must allow reading and writing the delivery bucket. When using
a separate source bucket, the source key must allow reading, writing, and
listing files in that bucket. Do not expose either application key to the
browser. The S3 endpoint and keys must be configured for the same B2 region.

## Bucket CORS and delivery

Configure bucket CORS to allow the exact website origins (production and local
development), `GET`, `HEAD`, and `PUT`, request headers required by the browser,
and expose the `ETag` response header. `ETag` is required by multipart upload
completion. HLS playlists and segments also need cross-origin `GET` access.
Use a public delivery bucket or a CDN configured to serve it; point
`B2_PUBLIC_BASE_URL` at that public/CDN object root. Keep a separate source
bucket private; without a separate source bucket, source uploads share the
delivery bucket's visibility. Use a CDN custom domain in production and cache
immutable rendition/segment objects for a long time.

Multipart upload sessions can be resumed by selecting the same file again in
the upload form. Uploaded parts are discovered from B2; failed part requests
retry with a fresh short-lived presigned URL. Unfinished B2 multipart uploads
should be expired with a bucket lifecycle rule. The B2 S3 client only calculates
checksums when required; optional SDK checksums can otherwise be signed for an
empty body even though the browser later uploads a non-empty part.

## Processing and playback

Run Redis and all microservices with `npm run dev:all` or the Docker Compose
stack. The video-service starts the BullMQ worker when Redis is configured.
FFmpeg and ffprobe must be available in the service image; the provided
video-service Dockerfile installs FFmpeg. Videos become active only after the HLS master playlist, renditions, and
thumbnail have been published.
