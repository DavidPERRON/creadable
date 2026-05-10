.PHONY: discover download extract aggregate full bootstrap clean stats

# ─────────────────────────────────────────────────────────────────
# Full pipeline (the most common command)
# Run after setting DEEPINFRA_API_KEY
# ─────────────────────────────────────────────────────────────────
full: discover download extract aggregate

# ─────────────────────────────────────────────────────────────────
# Stage 1 — URL discovery (uses annualreports.com + Bing fallback)
# Idempotent: skips corporates already with direct_pdf_url
# ─────────────────────────────────────────────────────────────────
discover:
	node engine/discover.js

discover-limit:
	node engine/discover.js --limit $(N)

# ─────────────────────────────────────────────────────────────────
# Stage 2 — Download PDFs and extract text
# Reads pdfs/ to skip already-downloaded
# ─────────────────────────────────────────────────────────────────
download:
	node engine/downloader.js

download-limit:
	node engine/downloader.js --limit $(N)

# Re-download a specific corporate (force)
download-id:
	rm -f pdfs/$(ID)_*.pdf text/$(ID)_*.txt
	node engine/downloader.js $(ID)

# ─────────────────────────────────────────────────────────────────
# Stage 3 — DeepInfra extraction (the LLM step)
# Requires: export DEEPINFRA_API_KEY=...
# Idempotent: skips corporates already extracted
# ─────────────────────────────────────────────────────────────────
extract:
	@if [ -z "$$DEEPINFRA_API_KEY" ]; then \
		echo "ERROR: set DEEPINFRA_API_KEY in env"; exit 1; \
	fi
	node engine/extractor.js

extract-dry:
	node engine/extractor.js --dry-run

extract-limit:
	@if [ -z "$$DEEPINFRA_API_KEY" ]; then \
		echo "ERROR: set DEEPINFRA_API_KEY in env"; exit 1; \
	fi
	node engine/extractor.js --limit $(N)

extract-id:
	@if [ -z "$$DEEPINFRA_API_KEY" ]; then \
		echo "ERROR: set DEEPINFRA_API_KEY in env"; exit 1; \
	fi
	node engine/extractor.js $(ID)

# ─────────────────────────────────────────────────────────────────
# Stage 4 — Aggregate into bank evidence + sweet-spot identification
# Uses ../prospection/data/banks.scored.json if available
# ─────────────────────────────────────────────────────────────────
aggregate:
	node engine/aggregator.js

# ─────────────────────────────────────────────────────────────────
# Bootstrap on a fresh Mac after git clone
# (re-downloads PDFs, re-extracts text, ready for extract)
# ─────────────────────────────────────────────────────────────────
bootstrap:
	@echo "[bootstrap] Re-downloading PDFs from catalog URLs..."
	@$(MAKE) download
	@echo "[bootstrap] PDFs cached to pdfs/, text to text/"
	@echo "[bootstrap] Next: export DEEPINFRA_API_KEY=... && make extract && make aggregate"

# ─────────────────────────────────────────────────────────────────
# Stats: how many corporates have URL / PDF / text / extraction
# ─────────────────────────────────────────────────────────────────
stats:
	@echo "── Catalog stats ──"
	@node -e "const c=require('./catalog.json').corporates; const stats={total:c.length,with_url:c.filter(x=>x.direct_pdf_url).length,without_url:c.filter(x=>!x.direct_pdf_url).length}; console.log(JSON.stringify(stats,null,2));"
	@echo "── PDFs / texts / extractions ──"
	@echo "  PDFs:        $$(ls pdfs/*.pdf 2>/dev/null | wc -l)"
	@echo "  texts:       $$(ls text/*.txt 2>/dev/null | wc -l)"
	@echo "  extractions: $$(ls extractions/*.json 2>/dev/null | wc -l)"

clean-extractions:
	rm -rf extractions/*.json reports/bank_evidence.* reports/new_banks_proposed.json

clean-all: clean-extractions
	rm -rf pdfs/*.pdf text/*.txt reports/download_manifest.json
