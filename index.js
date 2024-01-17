const { Client, GatewayIntentBits, User} = require("discord.js");
const puppeteer = require("puppeteer");
const { token, channelId, Username, Password } = require("./config.json");
const {Browser} = require("puppeteer");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on("ready", async () => {
    try {
        console.log(`Logged in as ${client.user.tag}`);
        const [browser, page] = await login();
        await GetHours(browser, page);
    } catch (error) {
        console.error("Error:", error.message);
    }
});

async function login() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://www.leonard-de-vinci.net/");

        await page.type('#login', Username);
        await page.click('#btn_next');

        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        await page.type('#passwordInput', Password);
        await page.click('#submitButton');

        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        await page.goto("https://www.leonard-de-vinci.net/student/presences/");

        //console.log(await page.content());

        return [browser, page];
    } catch (error) {
        console.error("Error while taking the website screenshot:", error.message);
    }
}

async function GetHours(browser, page) {
    const result = await page.evaluate(() => {
        const TrRows = document.querySelectorAll('tr');
        const times = [];

        for (let i = 0; i < TrRows.length; i++) {
            const Time = TrRows[i].querySelector('td:first-child');
            if (Time) {
                times.push(Time.textContent.trim());
            }
        }

        return times;
    });

    // Log the results
    result.forEach((time, index) => {
        console.log(`Time for row ${index + 1}: ${time}`);
    });
}



client.login(token);
