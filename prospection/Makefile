.PHONY: all score report scrape merge clean triggers network full weekly

all: score report network

# Core pipeline ───────────────────────────────────────────────
score:
	node engine/score.js

report: score
	node engine/report.js

network:
	node supply_chain/engine/network_targets.js

# Trigger Event Engine ───────────────────────────────────────
triggers:
	node trigger_engine/detector.js

# Scraper integration ───────────────────────────────────────
scrape-p1:
	cd .. && node scraper/bank_scraper.js P1
scrape-p2:
	cd .. && node scraper/bank_scraper.js P2
scrape-p3:
	cd .. && node scraper/bank_scraper.js P3

merge:
	node engine/merge_scraper.js ../scraper/output/$(JSON)

# Full cycle: scrape → merge → score → report
cycle-p1: scrape-p1
	@latest=$$(ls -t ../scraper/output/raw_P1_*.json | head -1); \
	node engine/merge_scraper.js $$latest && \
	$(MAKE) score report network

# Weekly recommended cron ────────────────────────────────────
# 1) Pull RSS triggers + auto-update DB
# 2) Re-score, re-generate report and network matrix
weekly: triggers all
	@echo ""
	@echo "Weekly cycle complete. Review:"
	@echo "  - reports/digest_$$(date -I).md       (new triggers detected)"
	@echo "  - reports/V4_$$(date -I).md            (regenerated priorities)"
	@echo "  - supply_chain/output/network_matrix.md"

# Full bootstrap (use for first run or after major DB edit)
full: triggers all
	@echo "Full pipeline executed."

clean:
	rm -f data/banks.scored.json reports/V4_*.md reports/digest_*.md supply_chain/output/network_matrix.md
