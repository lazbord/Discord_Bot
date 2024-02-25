const { Client, GatewayIntentBits, User} = require("discord.js");
const puppeteer = require("puppeteer");
const { token, channelId, Username, Password, MentionString } = require("./config.json");
const {Browser} = require("puppeteer");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

let cachedTimes = null;

let continueChecking = true;

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await sendChannelMessage(`Hello, ${MentionString}!`);
    checkActiveTimeSlot();
    setInterval(() => {
        if (continueChecking) {
            checkActiveTimeSlot();
        }
    }, 60000);
});

async function checkActiveTimeSlot() {
    if (cachedTimes === null) {
        console.log("Fetching times...");
        const [browser, page] = await login();
        cachedTimes = await GetHoursHref(browser, page);
        await logout(browser, page);
    }

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activeTimeSlot = cachedTimes.find(([startTime, endTime]) =>
        isCurrentTimeBetween(startTime, endTime, currentTime)
    );

    if (activeTimeSlot) {
        console.log(`Connecting during ${activeTimeSlot[0]} - ${activeTimeSlot[1]}`);
        await CheckPresence(activeTimeSlot[2]);
    } else {
        console.log("No active time slot at the moment.");
    }
}
async function CheckPresence(href) {
    const [browser, page] = await login();

    try {
        await page.goto(`https://www.leonard-de-vinci.net${href}`);
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }); // Increase timeout to 60 seconds

        const recapCoursElement = await page.$("#recap_cours");
        const originalH4Element = await recapCoursElement?.$eval('.panel-body h4', h4 => h4.textContent);

        // Set an interval to check for presence every minute
        const intervalId = setInterval(async () => {
            await page.reload(); // Reload the page
            const presenceElement = await page.$("#set-presence");

            if (presenceElement) {
                clearInterval(intervalId); // Stop checking once found
                continueChecking = false; // Stop the periodic checking
                await sendChannelMessage(`L'appel pour le cours : ${originalH4Element} est ouverte ${MentionString}`);
            }
        }, 60000); // Check every minute
    } catch (error) {
        console.error("Navigation timeout:", error.message);
        // Handle timeout error (e.g., retry or take appropriate action)
    }
}
function isCurrentTimeBetween(startTime, endTime, currentTime) {
    return startTime <= currentTime && currentTime <= endTime;
}
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

        console.log("Logged in Devinci site successfully");

        return [browser, page];
    } catch (error) {
        console.error("Error while taking the website screenshot:", error.message);
    }
}
async function GetHoursHref(browser, page) {
    return await page.evaluate(() => {
        const TrRows = document.querySelectorAll('tr');
        const times = [];

        for (let i = 0; i < TrRows.length; i++) {
            const Time = TrRows[i].querySelector('td:first-child');
            const Link = TrRows[i].querySelector('td a');

            if (Time && Link) {
                const timeArray = Time.innerText.split('-').map(time => time.trim());
                const hrefValue = Link.getAttribute('href').trim();

                times.push([...timeArray, hrefValue]);
            }
        }

        return times;
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
async function sendChannelMessage(messageContent) {
    const channel = await client.channels.fetch(channelId);
    await channel.send(messageContent);
}

client.login(token);
