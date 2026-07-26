/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const https = require("https");
const path = require("path");

const lines = {
  start: "歡迎來到地瓜飯小廚師！按下開始玩。",
  find: "找一找，三條地瓜藏在哪裡？",
  wash: "用手指在地瓜上來回搓一搓，把泥巴洗乾淨。",
  cut: "用手指在地瓜上往下滑，把地瓜切成小方塊。",
  mix: "把白飯和地瓜都放進鍋子裡。",
  cook: "按下大大的煮飯按鈕。",
  serve: "選一位客人，請他吃地瓜飯。",
  done: "好香的地瓜飯！你是最棒的小廚師！",
  found1: "找到第一條地瓜！",
  found2: "找到第二條地瓜！",
  found3: "三條地瓜都找到啦！",
  washDone: "洗得亮晶晶！",
  cut1: "切一刀！還有兩刀。",
  cut2: "切一刀！還有一刀。",
  cutDone: "切好了，變成小方塊！",
  rice: "白飯進鍋！",
  potato: "地瓜進鍋！",
  cookStart: "三、二、一，地瓜飯快快熟！",
  cookDone: "叮！地瓜飯煮好囉！",
  guest: "好香、好好吃，謝謝小廚師！",
};

const outputDir = path.join(__dirname, "..", "public", "voice");
fs.mkdirSync(outputDir, { recursive: true });

const headers = {
  "Content-Type": "application/json",
  Origin: "https://freetts.org",
  Referer: "https://freetts.org/",
  "User-Agent": "Mozilla/5.0",
};

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => {
        const data = Buffer.concat(chunks);
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`${response.statusCode}: ${data.toString()}`));
        } else {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  for (const [name, text] of Object.entries(lines)) {
    const body = JSON.stringify({
      text,
      voice: "zh-TW-HsiaoYuNeural",
      rate: "-10%",
      pitch: "+5Hz",
    });
    const generated = await request({
      hostname: "freetts.org",
      path: "/api/tts",
      method: "POST",
      headers: { ...headers, "Content-Length": Buffer.byteLength(body) },
    }, body);
    const { file_id: fileId } = JSON.parse(generated.toString());
    const audio = await request({
      hostname: "freetts.org",
      path: `/api/audio/${fileId}`,
      method: "GET",
      headers,
    });
    fs.writeFileSync(path.join(outputDir, `${name}.mp3`), audio);
    process.stdout.write(`${name} `);
  }
  process.stdout.write("\n");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
