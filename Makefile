# Atalhos para o fluxo com Docker. Só é preciso ter Docker instalado.
COMPOSE ?= docker compose
DEV = $(COMPOSE) --profile dev run --rm dev

.PHONY: up down build test test-unit test-i18n test-e2e shell serve preview clean

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

shell: build ## Terminal dentro do container de desenvolvimento
	$(DEV) bash

serve: build ## Site servido pelo container de desenvolvimento em http://localhost:4173
	$(COMPOSE) --profile dev run --rm --service-ports dev npm run serve

preview:     ## Imagem fechada, igual à publicada, em http://localhost:8081
	$(COMPOSE) --profile preview up --build preview

clean:       ## Remove resultados de testes e o volume de node_modules
	rm -rf test-results
	$(COMPOSE) --profile dev down -v
