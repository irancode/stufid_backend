````md
# Performance Issues & Fixes (Identifier Search API)

## 1. COUNT(*) on Fulltext / LIKE queries

### Problem
The COUNT query reuses the same WHERE conditions used for the search query.  
When Fulltext or LIKE is involved, this causes the database to execute a second expensive scan for the same dataset.

```sql
SELECT COUNT(*) AS item_count
FROM identifiers
WHERE ...
````

This effectively doubles the cost of every search request.

### Solution

* Remove COUNT from the main search endpoint
* Or make COUNT optional (only when explicitly required)
* Prefer a separate endpoint for counting if needed

---

## 2. LIKE fallback after Fulltext

### Problem

When Fulltext is not used, the system falls back to LIKE:

```sql
description_of_id LIKE ?
```

This leads to full table scans or inefficient index scans on large datasets.

### Solution

* Remove LIKE fallback in production
* Use Fulltext only:

```sql
MATCH(description_of_id) AGAINST(? IN BOOLEAN MODE)
```

---

## 3. Duplicate execution of search logic (COUNT + DATA)

### Problem

Two expensive operations run for a single request:

* Fulltext search query (data)
* COUNT(*) query (metadata)

Both execute the same filters, causing redundant work.

### Solution

* Do not compute COUNT in the same request as search results
* Separate data retrieval and counting into different flows

---

## 4. Runtime check for Fulltext index existence

### Problem

Checking `information_schema` on every request introduces unnecessary overhead under high traffic.

### Solution

* Cache the result globally
* Or evaluate it once at application startup and reuse it

---

## 5. ORDER BY + Fulltext relevance sorting cost

### Problem

Fulltext queries require:

* scoring matches
* sorting by relevance
* applying LIMIT after sorting

When many rows match (e.g. “مشهد”), sorting becomes expensive.

### Solution

* Ensure proper Fulltext index exists on the column
* Reduce matched dataset as early as possible
* Avoid unnecessary additional sorting layers

---

## 6. Combined performance bottleneck

### Problem

Performance degradation comes from combining:

* Fulltext search
* LIKE fallback
* COUNT(*) on same filters
* repeated query execution per request

### Solution Summary

* Use Fulltext only (no LIKE fallback)
* Remove COUNT from main search endpoint
* Avoid duplicate queries on same dataset
* Cache Fulltext availability check

```
```
