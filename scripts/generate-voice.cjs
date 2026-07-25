const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const meSpeak = require("mespeak");

meSpeak.loadConfig(require("mespeak/src/mespeak_config.json"));
meSpeak.loadVoice(require("mespeak/voices/zh.json"));

const lines = {
  start: "開始做地瓜飯！",
  find: "找一找，三條地瓜藏在哪裡？",
  wash: "用手指在地瓜上來回搓一搓，把泥巴洗乾淨。",
  cut: "用手指沿著虛線往下切，把地瓜切成小方塊。",
  mix: "把白飯和地瓜都放進鍋子裡。",
  cook: "按下大大的煮飯按鈕。",
  serve: "選一位客人，請他吃地瓜飯。",
  done: "好香的地瓜飯，你是最棒的小廚師！",
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

for (const [name, text] of Object.entries(lines)) {
  const wavPath = path.join(outputDir, `${name}.wav`);
  const mp3Path = path.join(outputDir, `${name}.mp3`);
  const wav = meSpeak.speak(text, {
    rawdata: "buffer",
    amplitude: 100,
    pitch: 62,
    speed: 145,
    wordgap: 2,
  });
  fs.writeFileSync(wavPath, wav);
  execFileSync("ffmpeg", [
    "-loglevel", "error",
    "-y",
    "-i", wavPath,
    "-codec:a", "libmp3lame",
    "-b:a", "48k",
    mp3Path,
  ]);
  fs.unlinkSync(wavPath);
}

console.log(`Generated ${Object.keys(lines).length} voice clips.`);
