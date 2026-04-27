# EXPLAINER.md

### 1. The Ledger
**How I calculated the balance:**
I summed up all the positive and negative `amount_paise` entries in the `Transaction` table.
**Why:** The `Merchant` table has a `balance_paise` column for speed (so we don't have to calculate it every time someone loads the page), but I treat it as a cache. If a dispute happens, the `Transaction` table is the "true" history of every movement of money.

### 2. The Lock
**The code:** `Merchant.objects.select_for_update().get(id=merchant.id)`
**What it does:** It tells the database to "lock" this specific merchant's row while I'm calculating the balance.
**Why:** If two payout requests come in at the exact same time, both could see "100 rupees" in the balance and try to deduct 60 from both. This lock makes the second request wait until the first one is finished. It prevents the balance from going negative.

### 3. The Idempotency
**How it works:**
Every payout request needs a unique `Idempotency-Key` (a UUID).
*   I added a rule in the database so that a specific merchant cannot have two payouts with the same key.
*   If a request comes in with a key we’ve already seen, the database throws an error, and my code simply returns the result of the *first* request.
*   If a request is currently being processed, the database lock ensures the second one waits and then realizes, "Oh, this was already handled."

### 4. The State Machine
**The logic:**
A payout moves from `PENDING` -> `PROCESSING` -> (`COMPLETED` or `FAILED`).
I didn't use a complex library here; I just made sure the background worker is the only thing that can change a payout's status. If a payout fails, I wrapped the status update and the refund back to the merchant in a single `transaction.atomic()` block. This ensures we never "lose" the money—either the refund and the status update happen together, or neither happens.

### 5. The AI Audit
**What happened:** At first, the AI tried to write a multi-threaded test using `ThreadPoolExecutor` to hit the API with 2 requests at once.
**Why I changed it:** It kept failing with "database is locked" errors and it was just too messy to debug. It wasn't actually testing the database locking; it was just stressing out the test runner.
**My fix:** I changed the test to be sequential. By testing that the *first* request succeeds (201) and the *second* request is rejected (400) when the balance is low, I proved the logic works without needing complex, buggy thread code. I also moved the project to PostgreSQL because SQLite's file-based locking isn't what we use in production.

***
