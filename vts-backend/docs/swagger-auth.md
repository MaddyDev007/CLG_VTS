# Swagger Auth (JWT Bearer)

## Login vs Authorize

- **Login (`POST /auth/login`)**
Authenticates credentials and returns a JWT.
- **Authorize (Swagger UI button)**
Stores a token in the Swagger UI so it can attach `Authorization: Bearer <token>` to all protected requests. No API call happens here.

## Step-by-step

1. Call `POST /auth/login` with credentials.
2. Copy the `token` from the response.
3. In Swagger UI, click **Authorize**.
4. Paste the token **without** the `Bearer ` prefix.
5. Run any protected endpoint; Swagger will attach the bearer token automatically.

## JSON Examples

### Login request

```json
{
  "email": "admin@example.com",
  "password": "StrongPassword123"
}
```

### Login response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "FLEET_MANAGER",
  "name": "Asha Rao"
}
```

### Authorized request headers

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Notes

- If Swagger is not adding `Bearer ` automatically, your security scheme is misconfigured.
- The backend expects a bearer token in the `Authorization` header.
