.PHONY: all bis report extract clean stats

all: bis report

bis:
	node engine/bis_calculator.js

report: bis
	node engine/bis_report.js
	@echo ""
	@echo "Dashboard: reports/bis_dashboard.html — open in browser"

extract:
	@if [ -z "$$DEEPINFRA_API_KEY" ]; then echo "ERROR: set DEEPINFRA_API_KEY"; exit 1; fi
	node engine/bank_extractor.js

extract-id:
	@if [ -z "$$DEEPINFRA_API_KEY" ]; then echo "ERROR: set DEEPINFRA_API_KEY"; exit 1; fi
	node engine/bank_extractor.js $(ID)

extract-dry:
	node engine/bank_extractor.js --dry-run

# Cycle complet: extract bank reports → BIS → report
full:
	$(MAKE) extract
	$(MAKE) bis
	$(MAKE) report

stats:
	@echo "── Bank intelligence stats ──"
	@echo "  Tech stack curated: $$(node -e 'console.log(require(\"./data/bank_techstack.json\").banks.length)')"
	@echo "  Fintech failures:   $$(node -e 'console.log(require(\"./data/fintech_failures.json\").events.length)')"
	@echo "  Bank extractions:   $$(ls extractions/*.json 2>/dev/null | wc -l)"
	@if [ -f reports/bis_scores.json ]; then \
		echo "  BIS scored:         $$(node -e 'console.log(require(\"./reports/bis_scores.json\").banks.length)')"; \
	fi

clean:
	rm -f reports/bis_*.md reports/bis_*.html reports/bis_*.json

clean-extractions:
	rm -rf extractions/*.json
