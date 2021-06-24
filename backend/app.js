require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const convert = require("xml-js");
const rateLimit = require("express-rate-limit");
var cors = require("cors");
const app = express();
const port = process.env.PORT;
const path = require('path');
const geoip = require('geoip-lite');

// see for info https://expressjs.com/en/guide/behind-proxies.html
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 1000,
  max: 1,
});

app.use(limiter);
var whitelist=process.env.ORIGIN.split(' ');
var siteorigin;
var corsOptions = {
  origin: function (origin, callback) {
    siteorigin=origin;
    console.log(origin);
    if (!origin || whitelist.indexOf(new URL(origin).hostname) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus: 200 // For legacy browser support
  }
app.use(cors(corsOptions));
app.get("/", (req, res) => res.redirect('https://prithwishpramanik.github.io/Weather-App/'));
// Routes
app.get("/api/search", async (req, res) => {
  try {
    if (!siteorigin)
    throw new Error("Unauthorised API call");
    var searchString = `${req.query.q}`;
    if (searchString=="self"){
      var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      var data = geoip.lookup(ip);
      searchString=data.city;
    }
    console.log(searchString);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${searchString}&units=metric&appid=${process.env.WEATHER_API_KEY}`,
    );

    const results = JSON.parse(await response.text());

    return res.json({
      success: true,
      results,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
