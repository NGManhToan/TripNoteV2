# Firebase shared-link setup

TripNote opens directly from its link. It does not require Firebase Authentication. Trips and saved destination IDs are stored in the shared Firestore workspace (`sharedWorkspaces/tripnote-public/trips` and `sharedWorkspaces/tripnote-public/preferences/favorites`), so every visitor to the same deployment sees and edits the same trips and favorites.

## Configure Firebase

1. In Firebase Console, create/enable Cloud Firestore for the `trip-note-2ab10` project.
2. Open **Firestore → Rules**, paste the contents of [`firestore.rules`](./firestore.rules), and publish them. The rules allow public read/write access only to the shared TripNote trips and favorites data.
3. Put the Firebase Web app values in the local `.env.local` file. Do not commit that file.

```dotenv
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=trip-note-2ab10
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Restart `npm run dev` after changing environment variables.

## Configure Netlify

In Netlify, add the same six `VITE_FIREBASE_*` values under **Site configuration → Environment variables**, then trigger a fresh deploy. Environment variables are embedded at build time, so the local `.env.local` values do not automatically reach Netlify.

## Existing data and privacy

When the shared trips collection is empty, the first browser that connects seeds it with that browser's locally stored non-demo trips. Existing local destination favorites are merged into the shared favorites document the first time each browser connects. After that, Firestore is authoritative and changes sync across devices. A browser must open the updated deployment once for favorites that exist only in its local storage to be merged. Existing trips saved only in another device's browser, or under an older authenticated Firestore path, are not automatically migrated; import/create them in the shared app or copy them into the shared collection.

Because this deployment has no login, anyone who can open the link can view, add, edit, and delete the shared trips and favorites. Do not store sensitive information there. Trip images and attachments remain in each browser's IndexedDB and do not sync in this implementation.

Without the Firebase environment values, the app still opens and stores trips locally in that browser only.
