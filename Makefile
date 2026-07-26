# Carton Camp — Makefile

PROJECT := carton-club-app
IMAGE := europe-west1-docker.pkg.dev/$(PROJECT)/sheets-creator/sheets-creator:latest

.PHONY: deploy
deploy: ## Build & push the image, then deploy to Cloud Run
	docker buildx build --push --platform linux/amd64 -t $(IMAGE) . ; gcloud run deploy sheets-creator --project=$(PROJECT) --image=$(IMAGE) --region=europe-west1 --platform=managed

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  %-12s %s\n", $$1, $$2}'
