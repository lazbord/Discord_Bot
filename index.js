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
    console.log(`Logged in as ${client.user.tag}`);
    const [browser, page] = await login();
    await GetHoursHref(browser, page);
    await logout(browser, page);
});

async function login() {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto("https://www.leonard-de-vinci.net/");

        await page.type('#login', Username);
        await page.click('#btn_next');

        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        await page.type('#passwordInput', Password);
        await page.click('#submitButton');

        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        await page.goto("https://www.leonard-de-vinci.net/student/presences/");

        console.log("Loggin in successfully");

        return [browser, page];
    } catch (error) {
        console.error("Error while taking the website screenshot:", error.message);
    }
}

async function GetHoursHref(browser, page) {
    const result = await page.evaluate(() => {
        const TrRows = document.querySelectorAll('tr');
        const times = [];

        for (let i = 0; i < TrRows.length; i++) {
            const Time = TrRows[i].querySelector('td:first-child');
            const Link = TrRows[i].querySelector('td a'); // Assuming the link is in the second column

            if (Time && Link) {
                // Split the time text using '-'
                const timeArray = Time.innerText.split('-').map(time => time.trim());

                // Get the href attribute value from the anchor element
                const hrefValue = Link.getAttribute('href').trim();

                // Add the split timeArray and hrefValue to the times array
                times.push([...timeArray, hrefValue]);
            }
        }

        return times;
    });

    // Log the results
    result.forEach((timeArray, index) => {
        console.log(`Time for row ${index + 1}: ${timeArray[0]} - ${timeArray[1]} - ${timeArray[2]}`);
    });
}

async function logout(browser, page) {
    const dropdownSelector = 'i.icon-caret-down';
    const logoutButtonSelector = 'a[href="/?LOGOUT"]';

    await page.waitForSelector(dropdownSelector);
    const dropdownIcon = await page.$(dropdownSelector);

    await dropdownIcon.click();

    await page.waitForSelector(logoutButtonSelector);
    const logoutButton = await page.$(logoutButtonSelector);

    await logoutButton.click();

    await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

    await browser.close();

    console.log("Logged out successfully");
}


client.login(token);
