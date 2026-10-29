# 0016 · Carpet photos are uploaded to the API server's disk

Date: 2026-10-29 · Status: accepted (owner chose to run the API on their own server, 141.11.107.22; the web stays on Vercel)

- **`POST /v1/media/carpets`** (admin only, multipart field `image`, at most 15 MB) stores a photo and returns `{ image, imageAspect }`. The admin form then saves those two fields with the existing `POST`/`PATCH /v1/carpets`. Because the upload is not tied to a carpet, a new carpet's form can show its photo before the carpet exists.
- **The file type is read from the first bytes** (JPEG, PNG or WebP). The file name and the browser's Content-Type are not trusted.
- **Every upload is re-encoded** with `sharp` to WebP, at most 2400 px wide, after applying the EXIF orientation.
  - Re-encoding drops EXIF, including the GPS position phones record, and anything hidden after the image data.
  - `limitInputPixels` caps the decode at 80 MP.
  - `imageAspect` is measured from the result, so the 3D cloth always matches the photo.
- **Files live under `MEDIA_DIR/carpets`**, named by the first 24 hex characters of their sha256. A URL therefore never changes meaning, and it is served with `Cache-Control: immutable`.
- **Saving checks the file.** A carpet whose `image` points at an upload that is not on disk is rejected with a 400 on the `image` field.
- **Replacing a photo deletes the old upload** once no carpet uses it any more. Soft-deleted carpets still count, so restoring one brings its photo back.
- **Abandoned uploads stay on disk.** A photo uploaded from a form that is never saved is not deleted. At catalogue scale this is a few megabytes; a sweep can be added if it ever matters.
- Photos under the web app's `public/carpets` are never touched.
- **`GET /v1/media/carpets/:file`** serves the photos. It only accepts names matching that hash pattern, so no path outside the folder can be reached.
- **Photos stay same-origin.** A carpet's `image` is stored as `/api/media/carpets/<file>`, which the web app's `/api` rewrite forwards to the API. three.js can then use the photos as textures without CORS, and `carpetSchema.image` keeps requiring a path that starts with `/`.
- **Memory:** an upload is held in memory, up to 15 MB plus its decode. That is fine for a single admin; it is not a public endpoint.
- **Request size on Vercel:** the browser's upload passes through Vercel's rewrite, so the request-size limit is Vercel's, not ours. The admin form therefore shrinks photos in the browser before sending them. The API's 15 MB limit is a backstop for direct calls.
- **Why not Vercel Blob or S3:** the owner already runs this server, the catalogue is a few dozen photos, and a disk folder needs no new account or monthly bill. `MEDIA_DIR` must be outside the release folder and included in the server's backups. If the API ever runs on more than one machine, this becomes object storage behind the same `ImageStorage` class.
