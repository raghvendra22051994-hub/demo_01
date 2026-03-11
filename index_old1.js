const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/dot/:number", async (req, res) => {

    const dot = req.params.number;

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

        $("table tr").each((i, el) => {

            const key = $(el).find("td").first().text().trim();
            const value = $(el).find("td").last().text().trim();

            if (key && value) {
                data[key] = value;
            }

        });

        if (Object.keys(data).length === 0) {
            return res.status(404).json({
                success: false,
                message: "DOT data not found"
            });
        }

        res.json({
            success: true,
            dot: dot,
            data: data
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch data",
            error: error.message
        });

    }

});

app.get("/", (req, res) => {
    res.send("SAFER DOT Lookup API Running");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});