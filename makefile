build:
	docker build -t the-circle-bot .

dev:
	docker run the-circle-bot

run:
	docker run -d the-circle-bot