# Atalhos para o fluxo com Docker. Só é preciso ter Docker instalado.
COMPOSE ?= docker compose
DEV = $(COMPOSE) --profile dev run --rm dev

.PHONY: up down build test test-unit test-i18n test-e2e manifests shell serve preview lighthouse clean

up:          ## Site em http://localhost:8082 (arquivos da pasta, sem cache)
	$(COMPOSE) up site

down:        ## Para tudo
	$(COMPOSE) --profile dev --profile preview down

build:       ## Constrói a imagem de desenvolvimento
	$(COMPOSE) --profile dev build dev

test: build  ## Todos os testes: unitários, paridade PT/EN e E2E
	$(DEV) npm test

test-unit: build
	$(DEV) npm run test:unit

test-i18n: build
	$(DEV) npm run test:i18n

test-e2e: build
	$(DEV) npm run test:e2e

manifests: build ## Valida os YAMLs das lições com kubeconform (ADR-006)
	$(DEV) node tests/tools/extract-manifests.mjs build/manifests
	docker run --rm -v "$(CURDIR)/build/manifests:/m:ro" --entrypoint /kubeconform ghcr.io/yannh/kubeconform:v0.8.0 \
	  -strict -summary -kubernetes-version $$($(DEV) node tests/tools/extract-manifests.mjs --k8s-version | tail -1) \
	  -schema-location default \
	  -schema-location 'https://raw.githubusercontent.com/datreeio/CRDs-catalog/main/{{.Group}}/{{.ResourceKind}}_{{.ResourceAPIVersion}}.json' /m

shell: build ## Terminal dentro do container de desenvolvimento
	$(DEV) bash

serve: build ## Site servido pelo container de desenvolvimento em http://localhost:4173
	$(COMPOSE) --profile dev run --rm --service-ports dev npm run serve

preview:     ## Imagem fechada, igual à publicada, em http://localhost:8081
	$(COMPOSE) --profile preview up --build preview

lighthouse: build ## Mede o site (mobile e desktop) com Lighthouse; saída em docs/lighthouse/ (NAME=after)
	$(COMPOSE) up -d site
	$(DEV) bash -c 'export CHROME_PATH=$$(ls -d /ms-playwright/chromium-*/chrome-linux*/chrome | head -1); for f in mobile desktop; do P=""; [ $$f = desktop ] && P="--preset=desktop"; npx -y lighthouse@13.6.0 http://site/ $$P --quiet --chrome-flags="--headless=new --no-sandbox" --output=json --output=html --output-path=docs/lighthouse/$(or $(NAME),latest)-$$f; done'

clean:       ## Remove resultados de testes e o volume de node_modules
	rm -rf test-results
	$(COMPOSE) --profile dev down -v
