const { Client, GatewayIntentBits } = require("discord.js");
const puppeteer = require("puppeteer");
const { token, channelId } = require("./config.json");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);

    setInterval(checkWebsite, 10000);
});

async function checkWebsite() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://www.leonard-de-vinci.net/");

        if (page.url() === "https://www.leonard-de-vinci.net/") {
            await page.evaluate(() => {
                if (document.getElementById("login") !== null) {
                    document.getElementById("login").value = "lazare.bordereaux@edu.devinci.fr";
                    document.getElementById("btn_next").click();
                }
            });
        }

        await new Promise(resolve => setTimeout(resolve, 5000));

        if (page.url().startsWith("https://adfs.devinci.fr/adfs/ls/")) {
            await page.evaluate(() => {
                document.getElementById("passwordInput").value = "@oJm3Qqg4$kSr^xJ3B";
                document.getElementById("submitButton").click();
            });
        }

        await new Promise(resolve => setTimeout(resolve, 5000));

        await page.goto("https://www.leonard-de-vinci.net/student/presences/");

        await new Promise(resolve => setTimeout(resolve, 5000));


        const screenshotBuffer = await page.screenshot();

        const channel = client.channels.cache.get(channelId);
        if (channel) {
            channel.send({
                files: [{
                    attachment: screenshotBuffer,
                    name: "website_screenshot.png"
                }]
            });
        }

        await browser.close();
    } catch (error) {
        console.error("Error while taking the website screenshot:", error.message);
    }
}

client.login(token);
