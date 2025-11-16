import express from 'express';
import cors from 'cors';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
app.use(cors());
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use('/temp', express.static('/tmp'));


// app.use('/temp/:folderId', express.static(path.join(__dirname, 'temp')));


const port = 5000;

app.post('/', (req,res) => {
    return res.json({message:"hello,buddy"}
    );
})

app.post('/scrape', async (req, res) => {
  try {
    const { targetUrl, summary } = req.body;

   


    const options = {
      method: "GET",
      url: "https://the-web-scraping-api.p.rapidapi.com/browser",
      params: {
        url: targetUrl, 
        country: "us",
        method: "GET",
        screenshot: "false",
        fullScreenshot: "false",
      },
      headers: {
        // "x-rapidapi-key": "3bfa1c3a5dmshab3b24751f55ca3p18de73jsn37b600407ce3",
        "x-rapidapi-key": process.env.RAPIDAPI_KEY,
        "x-rapidapi-host": "the-web-scraping-api.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    console.log(response.data);
    let html = response.data.data?.html || response.data.data || response.data;

    
    if (typeof html !== 'string') {
      html = JSON.stringify(html);
    }

    
    const baseUrl = new URL(targetUrl);
    html = html
      .replace(/(href|src)="\/(?!\/)/g, `$1="${baseUrl.origin}/`)
      .replace(/url\(['"]?\/(?!\/)/g, `url(${baseUrl.origin}/`);

    res.json({
      html
      // html: response.data.data || response.data,
    });

    // res.json(response.data); 
  } catch (error) {
    console.error('❌ Error fetching data:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
    res.status(500).json({ error: 'Failed to fetch data', details: error.response?.data });
  }
});

const downloadAssets = async (links, folder) => {
  for (const link of links) {
    try {
      if (!link.startsWith("http")) continue;

      const skipDomains = ["fonts.gstatic.com", "cdn.ampproject.org"];
      if (skipDomains.some(domain => link.includes(domain))) continue;

      if (!/\.(css|js)(\?|$)/.test(link)) continue;

      const fileData = await axios.get(link, {
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000,
      });

      const fileName = link.split("/").pop().split("?")[0];
      fs.writeFileSync(path.join(folder, fileName), fileData.data);
    } catch (err) {
      console.warn("❌ Skipping asset:", link, "| Reason:", err.message);
    }
  }
};

app.post("/download", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) return res.status(400).json({ error: "No HTML provided" });

    const folderId = uuidv4();
    const folder = path.join("/tmp", folderId);

    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(path.join(folder, "index.html"), html);

    const cssLinks = [...html.matchAll(/<link[^>]+href="(.*?)"/g)].map(m => m[1]);
    const jsLinks = [...html.matchAll(/<script[^>]+src="(.*?)"/g)].map(m => m[1]);

    await downloadAssets([...cssLinks, ...jsLinks], folder);

    // Create ZIP
    const zipPath = path.join(folder, "site.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(output);
    archive.directory(folder, false);

    await archive.finalize();

    // Wait for stream to finish
    output.on("close", () => {
      const downloadUrl = `${req.protocol}://${req.get('host')}/temp/${folderId}/site.zip`;
      console.log("✅ ZIP ready:", downloadUrl);
      res.json({ downloadUrl }); 

      // Cleanup after 60 seconds
      setTimeout(() => fs.rm(folder, { recursive: true, force: true }, () =>
        console.log(`🧹 Deleted temp folder: ${folder}`)
      ), 60000);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate ZIP" });
  }
});







app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
