```markdown
# Frame Server (upload PNG frames)

Minimal Express server to accept PNG frame uploads and serve them to the frontend.

## Install

```bash
npm install
```

## Run

Optional: provide an admin API key to protect upload endpoint:

```bash
export ADMIN_API_KEY="my-secret-key"
npm start
```

Without ADMIN_API_KEY the upload endpoint is open (not recommended for production).

Server runs on port 5000 by default. You can change with `PORT` env var.

## API

- GET /api/frames
  - Returns JSON array of uploaded frames:
    - { id, name, url, uploadedAt }

- POST /api/frames
  - Upload PNG file as `frame` form field (multipart/form-data)
  - Optional protection: set header `x-api-key: <ADMIN_API_KEY>` or query `?key=<ADMIN_API_KEY>`

- Static files available at:
  - /frames/:filename

## Example upload (curl)

```bash
curl -X POST -H "x-api-key: my-secret-key" -F "frame=@my-frame.png" http://localhost:5000/api/frames
```

## Notes

- Uploaded files saved in `uploads/`. Metadata in `uploads/frames.json`.
- In production, consider object storage (S3) and authentication.
```
