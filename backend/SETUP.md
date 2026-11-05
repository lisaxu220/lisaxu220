# Free cross-device sync setup

Use Supabase's **Free** plan and the existing free GitHub Pages hosting. Do not upgrade, attach paid services, or disable limits to make tests pass. Free services have quotas and may pause inactive projects; that can temporarily stop sync, while local tracking continues. This implementation never starts a paid plan automatically.

1. Create a project at https://supabase.com/dashboard on the Free plan. Keep its database password private.
2. In that project, open **SQL Editor → New query**. Paste the complete contents of `backend/setup.sql` and run it. It creates private per-account rows and the merge function; rerunning it preserves entries.
3. Under **Authentication → URL Configuration**, set Site URL to `https://lisaxu220.github.io/lisaxu220/` and allow that exact redirect URL. Leave email/password sign-in and email confirmation enabled. Supabase's built-in email delivery is limited: for this personal tracker use your Supabase project-owner email for signup. If verification mail is refused or rate-limited, inspect Auth's email settings; do not enable a paid mail service automatically.
4. From **Connect / API Keys**, obtain the project URL and **publishable** key (or legacy **anon** key). Put only these public values in `sync-config.js`. Never put a database password, secret key, or service-role key in this public repository or a chat message. RLS and the authenticated user token protect the data, not hiding the public key.
5. With those values connected, test account signup, confirmation, sign-in, two devices, cross-account isolation, and offline/reconnect against the real project before claiming live sync works. The current tests use a simulated HTTP service and real embedded PostgreSQL; they do not establish readiness of a newly created Supabase project.
6. Publish the app files to `gh-pages` after real integration validation. Bump the asset query strings and service worker cache version together whenever cached files change. Close and reopen the installed Android app while online to load the update. Sign in with the **same tracker account** on computer and phone; these are not GitHub or Supabase dashboard credentials.

## Data behavior

- The first sign-in to an account on each device imports that device's existing local entries, preserving their IDs. Neither device's whole list replaces the other's.
- Additions, outcome/date changes, and deletions save atomically on the device first. Tombstones prevent stale devices from restoring deleted entries.
- Reconnection, focus, local edits, a manual button, and a visible-page one-minute poll initiate sync. No background server, realtime subscription, or paid process is required.
- Changes to different entries merge. For competing edits to the same entry, the newer client timestamp wins, with a stable change-ID tie-break. Keep device clocks accurate. A later deliberate edit can restore a previously deleted entry from a stale device; this is a conflict resolution, not automatic resurrection.
- Each account has a separate local cache. Signing out restores the original guest entries. Switching accounts never uploads the previous account's cache. Cached account data remains on this browser/device until site storage is cleared; export before clearing it.
- Sessions refresh while online. A failed connection or expired session leaves local data intact. Auth tokens are not included in exports.
- Both devices need connectivity to the Supabase project for sync; GitHub Pages' accessibility does not establish Supabase reachability from every region or VPN.

## Before final deployment

The project URL/public key are connected and the live sync function was found to reject anonymous calls. Email/password signup is enabled and email confirmation is required. Signed-in cross-device verification remains outstanding until the user creates/signs in to a tracker account. Do not call cloud sync ready merely because the UI or simulated tests pass. Preserve the existing local-only public app until that prerequisite is met.
