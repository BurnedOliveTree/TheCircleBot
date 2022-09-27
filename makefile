build: bot.ts package.json
	docker build -t the-circle-bot .

dev: build
	docker run the-circle-bot

run: build
	docker run -d --restart unless-stopped the-circle-bot

logs:
	docker logs $(shell docker ps -q --filter ancestor=the-circle-bot)

clean:
	docker stop $(shell docker ps -q --filter ancestor=the-circle-bot)
	docker rm $(shell docker ps --filter status=exited -q)
