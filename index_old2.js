const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to clean text
function cleanText(text) {
    return text.replace(/\s+/g, " ").trim();
}

app.get("/dot/:number", async (req, res) => {
    const dot = req.params.number;

    // Validate USDOT number (1-10 digits)
    if (!/^\d{1,10}$/.test(dot)) {
        return res.status(400).json({ success: false, message: "Invalid USDOT number" });
    }

    const url = `https://safer.fmcsa.dot.gov/query.asp?query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dot}`;

    try {
        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "text/html",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        const $ = cheerio.load(response.data);
        const data = {};

        // SAFER snapshot table usually has 2 columns: key / value
        $("table").each((i, table) => {
            // Only consider tables where first row has exactly 2 <td> columns
            const firstRowTds = $(table).find("tr").first().find("td");
            if (firstRowTds.length !== 2) return;

            $(table).find("tr").each((j, row) => {
                const tds = $(row).find("td");
                if (tds.length !== 2) return;

                const key = cleanText($(tds[0]).text());
                const value = cleanText($(tds[1]).text());

                // Ignore empty or irrelevant rows
                if (key && value && !/^\d+$/.test(key)) {
                    data[key] = value;
                }
            });
        });

        if (Object.keys(data).length === 0) {
            return res.status(404).json({ success: false, message: "DOT data not found" });
        }

        res.json({
            success: true,
            dot,
            data
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch data", error: error.message });
    }
});

app.get("/", (req, res) => {
    res.send("SAFER DOT Lookup API Running");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});