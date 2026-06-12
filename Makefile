.PHONY: run test eval docker
run:
	uvicorn app.main:app --reload

test:
	pytest -q

eval:
	python scripts/run_eval.py

docker:
	docker compose up --build
