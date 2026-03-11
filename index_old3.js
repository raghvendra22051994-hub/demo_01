const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/dot/:number", async (req, res) => {
    const dot = req.params.number;
    if (!/^\d{1,10}$/.test(dot)) {
        return res.status(400).json({ success: false, message: "Invalid USDOT number" });
    }

    const url = `https://safer.fmcsa.dot.gov/query.asp?query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dot}`;

    try {
        const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        const data = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll("table tr"));
            let result = {};
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                if (cells.length === 2) {
                    const key = cells[0].innerText.trim();
                    const value = cells[1].innerText.trim();
                    if (key && value) result[key] = value;
                }
            });
            return result;
        });

        await browser.close();

        if (!Object.keys(data).length) {
            return res.status(404).json({ success: false, message: "DOT data not found" });
        }

        res.json({ success: true, dot, data });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch data", error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});