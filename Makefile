# Carton Camp — Makefile

IMAGE := europe-west1-docker.pkg.dev/carton-club-app/sheets-creator/sheets-creator:latest

.PHONY: deploy
deploy: ## Build & push the image, then deploy to Cloud Run
	docker buildx build --push --platform linux/amd64 -t $(IMAGE) . ; gcloud run deploy sheets-creator --image=$(IMAGE) --region=europe-west1 --platform=managed

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'
