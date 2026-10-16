# StudyPin Security Specification

## 1. Data Invariants
1. **User Invariant**: A user document in `/users/{userId}` can only be created, read, or modified by the authenticated user whose `request.auth.uid == userId`. No user can tamper with another student's streak or saved notes.
2. **Note Invariant**: A note pin in `/notes/{noteId}` must have an `uploaderId` strictly matching `request.auth.uid`. Notes are publicly readable so students can explore and discover shared materials. Only the creator (`request.auth.uid == resource.data.uploaderId`) can update or delete their note.
3. **Board Invariant**: A study board in `/boards/{boardId}` must have `ownerId == request.auth.uid`. Only the board owner can add or remove pinned note IDs or modify board metadata.
4. **ID Boundary Invariant**: Path variables must be valid alphanumeric strings under 128 characters (`isValidId`).
5. **Payload Size Invariant**: All string fields are bounded (`size() <= 2000` for descriptions, `<= 150` for titles) to prevent resource exhaustion attacks.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. **Unauthenticated Write**: Creating a note without `request.auth`.
2. **User Impersonation**: Creating a user profile with `userId != request.auth.uid`.
3. **Uploader Spoofing**: Setting `uploaderId` to another user's UID.
4. **Note Hijacking**: Updating another student's uploaded note pin.
5. **Board Hijacking**: Modifying another student's board or pinned items.
6. **Malicious ID Injection**: Document ID with path traversal or over 128 characters.
7. **Oversized String Injection**: Injecting a 2MB payload into `description`.
8. **Shadow Field Injection**: Adding arbitrary admin or elevation flags on create.
9. **Immutable Field Tampering**: Mutating `uploaderId` or `createdAt` on an existing note.
10. **Foreign Profile Inspection**: Querying or reading another user's private `/users/{userId}` document.
11. **Negative Counters**: Setting negative `likes` or `views`.
12. **Unverified Write**: Writing to collections with an unverified or null token.
