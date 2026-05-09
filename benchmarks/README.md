# Extraction benchmarks

Drop one CSV per prompt version into this directory:

- `bench_v1.csv`
- `bench_v2.csv`
- `bench_v3.csv`

## Schema

Each CSV has one row per (document, field) pair with these columns:

| column        | type   | description                                                                 |
|---------------|--------|-----------------------------------------------------------------------------|
| `doc_id`      | string | Identifier of the source document (e.g. `w9_acme`, `invoice_globex_001`).   |
| `field_name`  | string | The schema field being scored (e.g. `legal_name`, `ein`, `total`).          |
| `expected`    | string | Ground-truth value, stringified (dates as `YYYY-MM-DD`, numbers as decimal).|
| `actual`      | string | What the extractor returned for this field, same stringification rules.     |
| `correct`     | bool   | `true` / `false` — whether `actual` matches `expected` after normalization. |

## Example

```csv
doc_id,field_name,expected,actual,correct
w9_acme,legal_name,Acme Corp,Acme Corp,true
w9_acme,ein,12-3456789,12-3456789,true
w9_acme,tax_classification,C Corporation,Corporation,false
invoice_acme_001,total,5412.50,5412.50,true
```

## Stringification rules

- Dates: ISO `YYYY-MM-DD`.
- Decimals / money: fixed-point string with two decimal places, no thousands separator (`5412.50`, not `$5,412.50`).
- Booleans: lowercase `true` / `false`.
- Optional fields that are absent: empty string.
- `line_items` and other nested structures: one row per `(doc_id, field_name=line_items[i].<key>)` rather than a JSON blob, so per-field accuracy is measurable.

Per-version accuracy is `sum(correct) / count()` grouped by `field_name` and overall.
