# Sample documents

Drop the following 5 PDFs into this directory before running `python -m app.seed`:

- `w9_acme.pdf`
- `msa_acme.pdf`
- `invoice_acme_001.pdf`
- `w9_globex.pdf`
- `invoice_globex_001.pdf`

The seed script infers `doc_type` from the filename prefix (`w9_`, `msa_`,
`invoice_`), so keep that convention if you add more.
