# Portal Walas Web v2 — Test Report
Date: 18 November 2026

## Database
- Supabase project: portal-walas-v2
- Region: ap-southeast-1
- Classes: 30
- Members: 287
- Unique evaluations: 275
- Promotion rubric: 33 items
- Admin credentials: 1

## Frontend checks
- JavaScript syntax check: PASS
- Static HTTP serving: PASS
- Supabase URL + publishable key configured: PASS

## Walas functional checks
- Existing PIN hash migration: PASS
- Login using legacy class PIN pattern (C101): PASS
- Dashboard session authorization: PASS
- C101 member isolation: 12 rows returned
- Promotion dashboard: 12 rows returned
- Logout/session revocation: PASS
- Mutasi filtering enforced in Walas queries: PASS

## Admin functional checks
- Admin session authorization: PASS (temporary test session, rolled back)
- Recap reads 30 classes: PASS
- Member dashboard reads 287 members: PASS
- Promotion dashboard reads 287 members: PASS
- Mutasi is retained for Admin: PASS

## Safety / integrity
- Test sessions created inside rollback transactions where applicable.
- Legacy Apps Script portal was not modified.
- Plaintext PINs are not stored in the Web v2 database.
- Legacy Auth RPC surface was disabled after migration to PIN-session v2.

## Remaining publication step
Firebase Hosting connection/deployment is required to obtain the public web URL.
