# Firebase Service Account Key

⚠️ **IMPORTANT SECURITY NOTICE**

This file (`serviceAccountKey.json`) contains sensitive credentials and should **NEVER** be committed to version control.

## How to Obtain Your Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **spaktok-e7866**
3. Click the gear icon (⚙️) → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as `serviceAccountKey.json` in this directory

## File Location

Place the file here:
```
functions/serviceAccountKey.json
```

## Verification

After downloading, verify the file structure matches:
```json
{
  "type": "service_account",
  "project_id": "spaktok-e7866",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@spaktok-e7866.iam.gserviceaccount.com",
  ...
}
```

## Security Best Practices

- ✅ File is already in `.gitignore`
- ✅ Never share this file publicly
- ✅ Rotate keys regularly (every 90 days)
- ✅ Use environment variables in production
- ✅ For CI/CD, use GitHub Secrets or GCP Secret Manager

## Testing

Test your configuration:
```bash
cd functions
npm run serve
```

If configured correctly, you should see:
```
✔  functions: Loaded functions definitions from source
```
