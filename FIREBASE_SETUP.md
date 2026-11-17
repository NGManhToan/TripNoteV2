# Firebase shared-link setup

TripNote opens directly from its link. It does not require Firebase Authentication. Trips, saved destination IDs, and the custom in-app icon are stored in the shared Firestore workspace (`sharedWorkspaces/tripnote-public/trips` and `sharedWorkspaces/tripnote-public/preferences/favorites`). The optional iPhone Home Screen icon is stored locally on each iPhone and packaged into a Web Clip configuration profile only when the user asks to create one.

## Configure Firebase

1. In Firebase Console, create/enable Cloud Firestore for the `trip-note-2ab10` project.
2. Open **Firestore → Rules**, paste the contents of [`firestore.rules`](./firestore.rules), and publish them. The rules allow public read/write access to the shared TripNote trips and favorites. The shared in-app icon is stored alongside favorites, so it uses the existing favorites permission. No Cloud Storage bucket is required.
3. The shared `trip-note-2ab10` Web app configuration is included as a public client config fallback, so a Netlify build can connect without environment variables. You may override it with `.env.local` for a different local/staging project. Do not commit `.env.local`.

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

If you override the Firebase config locally, add the same six `VITE_FIREBASE_*` values under **Site configuration → Environment variables** in Netlify and trigger a fresh deploy. The default config targets `trip-note-2ab10` and works without Netlify variables. Environment variables are embedded at build time, so local `.env.local` values do not automatically reach Netlify.

## Existing data and privacy

When the shared trips collection is empty, the first browser that connects seeds it with that browser's locally stored non-demo trips. Existing local destination favorites are merged into the shared favorites document the first time each browser connects. After that, Firestore is authoritative and changes sync across devices. A browser must open the updated deployment once for favorites that exist only in its local storage to be merged. Existing trips saved only in another device's browser, or under an older authenticated Firestore path, are not automatically migrated; import/create them in the shared app or copy them into the shared collection.

Because this deployment has no login, anyone who can open the link can view, add, edit, and delete the shared trips, favorites, and in-app icon. Do not store sensitive information there. The shared in-app icon is resized to 512×512. The optional iPhone Home Screen image is kept locally on that device; iOS requires manual confirmation to install/update a Web Clip profile or remove and re-add a Safari Home Screen icon. Activity photos and trip cover attachments remain in each browser's IndexedDB and do not sync.

If Firestore Rules are not published or Firestore is unavailable, the app still opens and stores trips locally in that browser only. A phone containing trips only in local storage must open the updated deployment and successfully connect while the shared trips collection is empty to seed those trips for other devices.
