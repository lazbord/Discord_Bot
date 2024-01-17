const { Client, GatewayIntentBits } = require("discord.js");
const puppeteer = require("puppeteer");
const { token, channelId, username, password } = require("./config.json");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
    const [browser, page] = await login();
    await getHours(browser, page);
});



async function login() {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://www.leonard-de-vinci.net/");

        // Wait for the login input field to appear
        await page.waitForSelector("#login", { timeout: 5000 });

        if (page.url() === "https://www.leonard-de-vinci.net/") {
            await page.evaluate(() => {
                if (document.getElementById("login") !== null) {
                    document.getElementById("login").value = "lazare.bordereaux@edu.devinci.fr";
                    document.getElementById("btn_next").click();
                }
            });
        }

        await page.waitForSelector("#passwordInput", { timeout: 5000 });

        if (page.url().startsWith("https://adfs.devinci.fr/adfs/ls/")) {
            await page.evaluate(() => {
                document.getElementById("passwordInput").value = "@oJm3Qqg4$kSr^xJ3B";
                document.getElementById("submitButton").click();
            });
        }

        sendMessage("Connected to Devinci Attendance Page");

        await page.goto("https://www.leonard-de-vinci.net/student/presences/", { timeout: 1000 });
        await page.evaluate(() => {
            var TrRows = document.querySelectorAll('tr');
            for (var i = 0; i < TrRows.length; i++) {
                var Time = TrRows[i].querySelector('td:first-child');
                if (Time) {
                    console.log(`Time for row ${i + 1}: ${Time.textContent.trim()}`);
                }
            }
        });
        console.log("Get tr and td");

        return [browser, page];

    } catch (error) {
        console.error("Error while connecting to website:", error.message);
    }
}

async function getHours(browser, page) {

}


function sendMessage(message) {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send(message);
    }
}

client.login(token);
