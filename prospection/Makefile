.PHONY: all score report scrape merge clean

all: score report

score:
	node engine/score.js

report: score
	node engine/report.js

scrape-p1:
	cd .. && node scraper/bank_scraper.js P1
scrape-p2:
	cd .. && node scraper/bank_scraper.js P2
scrape-p3:
	cd .. && node scraper/bank_scraper.js P3

# Merge latest scraper output into DB (replace path as needed)
merge:
	node engine/merge_scraper.js ../scraper/output/$(JSON)

# Full cycle: scrape → merge → score → report
cycle-p1: scrape-p1
	@latest=$$(ls -t ../scraper/output/raw_P1_*.json | head -1); \
	node engine/merge_scraper.js $$latest && \
	$(MAKE) score report

clean:
	rm -f data/banks.scored.json reports/V4_*.md
