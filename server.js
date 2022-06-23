const express = require("express")
const axios = require("axios")
const cheerio = require("cheerio")
const puppeteer = require("puppeteer")
const { Cluster } = require("puppeteer-cluster")

const app = express()

app.set("view engine")

app.get("/", function(req, res) {
	axios.get("https://en.wikipedia.org/wiki/National_Basketball_Association")
	.then((response) => {
		const html = response.data
		const $ = cheerio.load(html)
		const title = $("#firstHeading").text()
		const teams = []
		
		for (let i = 0; i < 30; i++) {
			teams.push({ "name": $('td > b > a', html)[i].attribs.title, "arena": $('td:nth-child(3) > a', html)[i].attribs.title})
		}
		
		console.log(title);
		console.log(teams);
		
		res.send(teams)
	})
})

app.get("/skm", function(req, res) {
	axios.get("https://skm.dgip.go.id/index.php/skm/detailkelas/1")
	.then((response) => {
		const html = response.data
		const $ = cheerio.load(html)
		const title = $('.templatemo-content > h1:nth-child(2)').text()
		const bodyLength = $('tbody > tr').length;
		const items = []
		
		for (let i = 0; i < 50; i++) {
			items.push({ "indo": $(`tr:nth-child(${i}) > td:nth-child(1)`).text(), "eng": $(`tr:nth-child(${i}) > td:nth-child(2)`).text() })
		}
		
		console.log(title)
		console.log(items)
		
		res.send(items)
	})
})

app.get("/g2g", function(req, res) {
	const items = [];
	const g2gUrls = [];
	
	(async () => {
		const cluster = await Cluster.launch({
			concurrency: Cluster.CONCURRENCY_CONTEXT,
			maxConcurrency: 2,
		})
		
		const scrape = async ({ page, data: url }) => {
			await page.goto(url)
			const $ = cheerio.load(await page.content())
			const title = $('.main__title-skin').text()
			const price = $('#precheckout_ppu_amount').text()
			
			items.push({ title: title, price: price })
			
			console.log({ title: title, price: price })

		}
		
		await cluster.task(async ({ page }) => {
			await page.goto('https://www.g2g.com/id/categories/wow-classic-tbc-gold-for-sale')
			const $ = cheerio.load(await page.content())
			const hrefs = $('.q-col-gutter-md-md > div > div:nth-child(1) > a:nth-child(1)')
				
			for (let i = 0; i < hrefs.length; i++) {
				cluster.queue(hrefs[i].attribs.href, scrape)
			}
			
		})
		
		cluster.queue()
		
		
		await cluster.idle()
		await cluster.close()
		
		res.send(items)
	})()
	
	
})

app.listen(8081, () => {
	console.log('Running on port 8081')
})
