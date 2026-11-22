"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Stage = "home" | "choose" | "order" | "find" | "wash" | "cut" | "rinse" | "mix" | "cook" | "decorate" | "serve" | "done";
type Recipe = { id: string; name: string; color: string; sticker: string };
type Topping = { id: string; name: string; emoji: string };
type Guest = { name: string; emoji: string; line: string };
type Outfit = { name: string; icon: string; need: number };

const stages: Stage[] = ["choose", "order", "find", "wash", "cut", "rinse", "mix", "cook", "decorate", "serve"];
const recipes: Recipe[] = [
  { id: "gold", name: "黃金地瓜", color: "#f1a33f", sticker: "🌟" },
  { id: "purple", name: "紫心地瓜", color: "#8552a1", sticker: "💜" },
  { id: "orange", name: "紅心地瓜", color: "#ed7041", sticker: "🧡" },
];
const toppings: Topping[] = [
  { id: "corn", name: "玉米", emoji: "🌽" },
  { id: "carrot", name: "紅蘿蔔", emoji: "🥕" },
  { id: "mushroom", name: "香菇", emoji: "🍄" },
  { id: "edamame", name: "毛豆", emoji: "🫛" },
  { id: "pumpkin", name: "南瓜", emoji: "🎃" },
  { id: "egg", name: "滷蛋", emoji: "🥚" },
  { id: "broccoli", name: "青花菜", emoji: "🥦" },
];
const guests: Guest[] = [
  { name: "小熊", emoji: "🐻", line: "我今天肚子咕嚕咕嚕！" },
  { name: "小兔", emoji: "🐰", line: "我想吃香香甜甜的飯！" },
  { name: "小狗", emoji: "🐶", line: "汪！我帶著好胃口來了！" },
  { name: "小貓", emoji: "🐱", line: "喵～請幫我做漂亮的地瓜飯！" },
  { name: "小狐狸", emoji: "🦊", line: "我最會找好吃的料理了！" },
  { name: "小象", emoji: "🐘", line: "我想要一大碗健康的飯！" },
  { name: "阿公", emoji: "👴", line: "慢慢做、用心做，就是好料理。" },
  { name: "阿嬤", emoji: "👵", line: "我最喜歡小廚師做的飯！" },
];
const outfits: Outfit[] = [
  { name: "白色廚師帽", icon: "☁", need: 0 },
  { name: "紫色廚師帽", icon: "🎩", need: 2 },
  { name: "地瓜葉帽", icon: "🌿", need: 4 },
  { name: "南瓜帽", icon: "🎃", need: 6 },
  { name: "星星廚師帽", icon: "🌟", need: 8 },
  { name: "皇冠廚師帽", icon: "👑", need: 10 },
];
const celebrationLines = ["客人開心地跳起舞！", "飯鍋冒出了愛心蒸氣！", "大家一起和料理拍照！", "香味飄到整座地瓜村！"];

function readSaved<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}
const titles: Record<Stage, string> = {
  home: "地瓜飯小廚師",
  choose: "選地瓜",
  order: "接到點餐",
  find: "找地瓜",
  wash: "洗一洗",
  cut: "變小塊",
  rinse: "洗白米",
  mix: "放進鍋",
  cook: "煮飯飯",
  decorate: "完成擺盤",
  serve: "請客人吃",
  done: "完成啦",
};
const prompts: Record<Stage, string> = {
  home: "歡迎來到地瓜飯小廚師，按下開始玩。",
  choose: "選一種今天想煮的地瓜。",
  order: "客人想吃香香的地瓜飯，準備好了就開始吧。",
  find: "找一找，三條地瓜藏在哪裡？",
  wash: "用手指在地瓜上來回搓一搓，把泥巴洗乾淨。",
  cut: "用手指沿著虛線往下切，把地瓜切成小方塊。",
  rinse: "用手指繞圈圈洗白米。",
  mix: "把白米和地瓜拖進鍋子裡。",
  cook: "按下大大的煮飯按鈕。",
  decorate: "看看點餐內容，選出客人想要的配料。",
  serve: "選一位客人，請他吃地瓜飯。",
  done: "好香的地瓜飯，你是最棒的小廚師！",
};
const taiwanesePrompts: Record<Stage, string> = {
  home: "歡迎來做番薯飯，揤開始來𨑨迌。",
  choose: "揀一款你今仔日想欲煮的番薯。",
  order: "人客想欲食芳芳的番薯飯，準備好就開始。",
  find: "揣看覓，三條番薯囥佇佗位？",
  wash: "用手指共番薯捽予清氣。",
  cut: "順紲虛線共番薯切做細箍。",
  rinse: "用手指畫輾轉來洗米。",
  mix: "共米佮番薯囥入去鍋仔。",
  cook: "揤落大粒的煮飯鈕。",
  decorate: "揀人客想欲食的配料。",
  serve: "共番薯飯送予人客。",
  done: "足芳的番薯飯，你是上𠢕的小廚師。",
};

let activeVoice: HTMLAudioElement | null = null;

const voiceFiles: Record<string, string> = {
  "歡迎來到地瓜飯小廚師，按下開始玩。": "start",
  "開始做地瓜飯！": "start",
  "選一種今天想煮的地瓜。": "find",
  "客人想吃香香的地瓜飯，準備好了就開始吧。": "serve",
  "找一找，三條地瓜藏在哪裡？": "find",
  "用手指在地瓜上來回搓一搓，把泥巴洗乾淨。": "wash",
  "用手指沿著虛線往下切，把地瓜切成小方塊。": "cut",
  "用手指繞圈圈洗白米。": "wash",
  "把白米和地瓜拖進鍋子裡。": "mix",
  "把白飯和地瓜都放進鍋子裡。": "mix",
  "按下大大的煮飯按鈕。": "cook",
  "看看點餐內容，選出客人想要的配料。": "serve",
  "選一位客人，請他吃地瓜飯。": "serve",
  "好香的地瓜飯，你是最棒的小廚師！": "done",
  "找到第1條地瓜！": "found1",
  "找到第2條地瓜！": "found2",
  "三條地瓜都找到啦！": "found3",
  "洗得亮晶晶！": "washDone",
  "切一刀！還有2刀。": "cut1",
  "切一刀！還有1刀。": "cut2",
  "切好了，變成小方塊！": "cutDone",
  "白飯進鍋！": "rice",
  "地瓜進鍋！": "potato",
  "三、二、一，地瓜飯快快熟！": "cookStart",
  "叮！地瓜飯煮好囉！": "cookDone",
};

function voiceFileFor(text: string) {
  if (text.includes("說，好香、好好吃，謝謝小廚師！")) return "guest";
  return voiceFiles[text];
}

function deviceSpeech(text: string, lang = "zh-TW") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const engine = window.speechSynthesis;
  engine.cancel();
  engine.resume();
  const line = new SpeechSynthesisUtterance(text);
  const voices = engine.getVoices();
  const wanted = lang.toLowerCase();
  const voice =
    voices.find(item => item.lang.toLowerCase() === wanted) ||
    voices.find(item => item.lang.toLowerCase() === "zh-tw") ||
    voices.find(item => item.lang.toLowerCase() === "zh-hk") ||
    voices.find(item => item.lang.toLowerCase() === "zh-cn") ||
    voices.find(item => item.lang.toLowerCase().startsWith("zh"));
  if (voice) line.voice = voice;
  line.lang = voice?.lang || lang;
  line.volume = 1;
  line.rate = 0.84;
  line.pitch = 1.12;
  engine.speak(line);
}

function speak(text: string, enabled = true, language: "mandarin" | "taiwanese" = "mandarin") {
  if (!enabled || typeof window === "undefined") return;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  activeVoice?.pause();

  if (language === "taiwanese") {
    deviceSpeech(text, "nan-TW");
    return;
  }
  const file = voiceFileFor(text);
  if (!file) {
    deviceSpeech(text);
    return;
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const audio = new Audio(`${basePath}/voice/${file}.mp3`);
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.volume = 1;
  activeVoice = audio;
  let fellBack = false;
  const fallbackOnce = () => {
    if (fellBack) return;
    fellBack = true;
    deviceSpeech(text);
  };
  audio.addEventListener("error", fallbackOnce, { once: true });
  void audio.play().catch(fallbackOnce);
}

function Potato({ clean = false, tiny = false }: { clean?: boolean; tiny?: boolean }) {
  return (
    <span className={`potato ${clean ? "clean" : ""} ${tiny ? "tiny" : ""}`}>
      <i className="eye left" />
      <i className="eye right" />
      {!clean && <><i className="mud one" /><i className="mud two" /></>}
    </span>
  );
}

function PotatoCube({ index = 0 }: { index?: number }) {
  return (
    <span className={`potato-cube cube-${index % 4}`} aria-hidden="true">
      <i className="cube-shine" />
    </span>
  );
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("home");
  const [sound, setSound] = useState(true);
  const [found, setFound] = useState<number[]>([]);
  const [washed, setWashed] = useState(0);
  const [cut, setCut] = useState(0);
  const [rinsed, setRinsed] = useState(0);
  const [food, setFood] = useState<string[]>([]);
  const [timer, setTimer] = useState(3);
  const [guest, setGuest] = useState("");
  const [orderGuest, setOrderGuest] = useState<Guest>(guests[0]);
  const [orderTopping, setOrderTopping] = useState<Topping>(toppings[0]);
  const [chosenTopping, setChosenTopping] = useState<Topping | null>(null);
  const [recipe, setRecipe] = useState<Recipe>(recipes[0]);
  const [difficulty, setDifficulty] = useState<"easy" | "challenge">(() => readSaved("sweet-potato-difficulty", "easy"));
  const [gameMode, setGameMode] = useState<"quick" | "full">(() => readSaved("sweet-potato-mode", "quick"));
  const [language, setLanguage] = useState<"mandarin" | "taiwanese">(() => readSaved("sweet-potato-language", "mandarin"));
  const [outfit, setOutfit] = useState(() => readSaved("sweet-potato-outfit", "白色廚師帽"));
  const [outfitOpen, setOutfitOpen] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [stickerBookOpen, setStickerBookOpen] = useState(false);
  const [stickers, setStickers] = useState<Record<string, number>>(() => readSaved("sweet-potato-stickers", {}));
  const [awardedCount, setAwardedCount] = useState(0);
  const [learningMessage, setLearningMessage] = useState("");
  const [holdingParent, setHoldingParent] = useState(false);
  const [celebration, setCelebration] = useState(celebrationLines[0]);
  const [draggingFood, setDraggingFood] = useState<{ item: string; x: number; y: number } | null>(null);
  const washing = useRef(false);
  const washPoint = useRef({ x: 0, y: 0 });
  const cutStart = useRef<{ x: number; y: number } | null>(null);
  const rinsePoint = useRef<{ x: number; y: number } | null>(null);
  const potRef = useRef<HTMLDivElement | null>(null);
  const parentHold = useRef<number | null>(null);
  const awarded = useRef(false);
  const stickersRef = useRef(stickers);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    window.localStorage.setItem("sweet-potato-difficulty", JSON.stringify(difficulty));
    window.localStorage.setItem("sweet-potato-mode", JSON.stringify(gameMode));
    window.localStorage.setItem("sweet-potato-language", JSON.stringify(language));
    window.localStorage.setItem("sweet-potato-outfit", JSON.stringify(outfit));
  }, [difficulty, gameMode, language, outfit]);

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    stickersRef.current = stickers;
  }, [stickers]);

  useEffect(() => {
    if (stage !== "done" || awarded.current) return;
    awarded.current = true;
    const nextCount = (stickersRef.current[recipe.id] || 0) + 1;
    setAwardedCount(nextCount);
    setStickers(current => {
      const next = { ...current, [recipe.id]: (current[recipe.id] || 0) + 1 };
      window.localStorage.setItem("sweet-potato-stickers", JSON.stringify(next));
      return next;
    });
  }, [stage, recipe.id]);

  useEffect(() => {
    if (stage === "home") return;
    const text = language === "taiwanese" ? taiwanesePrompts[stage] : prompts[stage];
    const id = window.setTimeout(() => speak(text, sound, language), 250);
    return () => clearTimeout(id);
  }, [stage, sound, language]);

  function unlockSound() {
    if (!sound) return null;
    const AudioCtx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext.current) audioContext.current = new AudioCtx();
    const ctx = audioContext.current;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  function ping(win = false) {
    const ctx = unlockSound();
    if (!ctx) return;
    (win ? [523, 659, 784] : [659]).forEach((hz, index) => {
      const tone = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = ctx.currentTime + index * 0.11;
      tone.frequency.value = hz;
      gain.gain.setValueAtTime(0.001, at);
      gain.gain.exponentialRampToValueAtTime(0.1, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.17);
      tone.connect(gain).connect(ctx.destination);
      tone.start(at);
      tone.stop(at + 0.18);
    });
  }

  function go(next: Stage) {
    ping(next === "done");
    setStage(next);
  }

  function reset() {
    setFound([]); setWashed(0); setCut(0); setRinsed(0); setFood([]); setTimer(3); setGuest("");
    setChosenTopping(null);
    setLearningMessage("");
    setAwardedCount(0);
    awarded.current = false;
    go("home");
  }

  function startGame() {
    const random = new Uint32Array(3);
    window.crypto.getRandomValues(random);
    setOrderGuest(guests[random[0] % guests.length]);
    setOrderTopping(toppings[random[1] % toppings.length]);
    setCelebration(celebrationLines[random[2] % celebrationLines.length]);
    unlockSound();
    speak(language === "taiwanese" ? "開始來做番薯飯。" : "開始做地瓜飯！", sound, language);
    go("choose");
  }

  function chooseRecipe(nextRecipe: Recipe) {
    setRecipe(nextRecipe);
    ping();
    go("order");
  }

  function findPotato(id: number) {
    if (found.includes(id)) return;
    const challengeOrder = [2, 1, 3];
    if (difficulty === "challenge" && id !== challengeOrder[found.length]) {
      setLearningMessage(found.length === 0 ? "先找最大的地瓜喔！" : "再看看大小，慢慢找！");
      ping();
      return;
    }
    setLearningMessage("");
    const next = [...found, id];
    setFound(next);
    ping();
    speak(next.length === 3 ? "三條地瓜都找到啦！" : `找到第${next.length}條地瓜！`, sound);
    if (next.length === 3) setTimeout(() => go("wash"), 800);
  }

  function startWash(event: ReactPointerEvent<HTMLDivElement>) {
    washing.current = true;
    washPoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveWash(event: ReactPointerEvent<HTMLDivElement>) {
    if (!washing.current || washed >= 100) return;
    const distance = Math.hypot(
      event.clientX - washPoint.current.x,
      event.clientY - washPoint.current.y,
    );
    if (distance < 5) return;
    washPoint.current = { x: event.clientX, y: event.clientY };
    const next = Math.min(100, washed + distance * 0.35);
    setWashed(next);
    if (Math.floor(next / 20) > Math.floor(washed / 20)) ping();
    if (next >= 100) {
      washing.current = false;
      speak("洗得亮晶晶！", sound);
      setTimeout(() => go("cut"), 900);
    }
  }

  function stopWash() {
    washing.current = false;
  }

  function tapWash() {
    const next = Math.min(100, washed + 25);
    setWashed(next);
    ping();
    if (next >= 100) {
      speak("洗得亮晶晶！", sound, language);
      setTimeout(() => go("cut"), 700);
    }
  }

  function startCut(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    cutStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishCut(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const start = cutStart.current;
    cutStart.current = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) < 32) return;
    const next = Math.min(cut + 1, 3);
    setCut(next);
    ping();
    speak(next === 3 ? "切好了，變成小方塊！" : `切一刀！還有${3 - next}刀。`, sound);
    if (next === 3) {
      if (gameMode === "quick") {
        setFood(["rice", "potato"]);
        setTimeout(() => go("cook"), 1200);
      } else {
        setTimeout(() => go("rinse"), 1200);
      }
    }
  }

  function tapCut() {
    const next = Math.min(cut + 1, 3);
    setCut(next);
    ping();
    if (next === 3) {
      if (gameMode === "quick") {
        setFood(["rice", "potato"]);
        setTimeout(() => go("cook"), 800);
      } else {
        setTimeout(() => go("rinse"), 800);
      }
    }
  }

  function startRinse(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    rinsePoint.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveRinse(event: ReactPointerEvent<HTMLDivElement>) {
    if (!rinsePoint.current || rinsed >= 100) return;
    event.preventDefault();
    const distance = Math.hypot(event.clientX - rinsePoint.current.x, event.clientY - rinsePoint.current.y);
    if (distance < 4) return;
    rinsePoint.current = { x: event.clientX, y: event.clientY };
    const next = Math.min(100, rinsed + distance * .3);
    setRinsed(next);
    if (Math.floor(next / 20) > Math.floor(rinsed / 20)) ping();
    if (next >= 100) {
      rinsePoint.current = null;
      speak("洗得亮晶晶！", sound);
      setTimeout(() => go("mix"), 900);
    }
  }

  function addFood(item: string) {
    if (food.includes(item)) return;
    if (difficulty === "challenge" && item === "potato" && !food.includes("rice")) {
      setLearningMessage("先放白米，再放地瓜塊！");
      ping();
      return;
    }
    setLearningMessage("");
    const next = [...food, item];
    setFood(next); ping();
    speak(item === "rice" ? "白飯進鍋！" : "地瓜進鍋！", sound);
    if (next.length === 2) setTimeout(() => go("cook"), 750);
  }

  function startFoodDrag(item: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (food.includes(item)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingFood({ item, x: event.clientX, y: event.clientY });
  }

  function moveFoodDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!draggingFood) return;
    event.preventDefault();
    setDraggingFood(current => current ? { ...current, x: event.clientX, y: event.clientY } : null);
  }

  function finishFoodDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!draggingFood) return;
    event.preventDefault();
    const rect = potRef.current?.getBoundingClientRect();
    const dropped = rect &&
      event.clientX >= rect.left - 30 && event.clientX <= rect.right + 30 &&
      event.clientY >= rect.top - 30 && event.clientY <= rect.bottom + 30;
    const item = draggingFood.item;
    setDraggingFood(null);
    if (dropped) addFood(item);
    else ping();
  }

  function cookRice() {
    if (timer < 3) return;
    speak("三、二、一，地瓜飯快快熟！", sound);
    [2, 1, 0].forEach((value, index) => setTimeout(() => {
      setTimer(value);
      ping(value === 0);
      if (value === 0) {
        speak("叮！地瓜飯煮好囉！", sound);
        setTimeout(() => setStage("decorate"), 900);
      }
    }, 850 * (index + 1)));
  }

  function chooseTopping(topping: Topping) {
    if (topping.id !== orderTopping.id) {
      setLearningMessage(`客人想要的是${orderTopping.name}，再找找看！`);
      ping();
      return;
    }
    setLearningMessage("");
    setChosenTopping(topping);
    ping(true);
    setTimeout(() => go("serve"), 850);
  }

  function serve(name: string) {
    setGuest(name); ping(true);
    speak(`${name}說，好香、好好吃，謝謝小廚師！`, sound);
    setTimeout(() => setStage("done"), 1200);
  }

  const activeStages = gameMode === "quick"
    ? stages.filter(item => !["rinse", "mix"].includes(item))
    : stages;
  const step = activeStages.indexOf(stage);
  const stickerTotal = Object.values(stickers).reduce((sum, count) => sum + count, 0);
  const hatEmoji = outfits.find(item => item.name === outfit)?.icon || "☁";
  const recipeCount = stickers[recipe.id] || 0;
  const displayedRecipeCount = awardedCount || recipeCount;
  const milestone = displayedRecipeCount >= 10 ? "地瓜大師徽章" : displayedRecipeCount >= 5 ? "金色貼紙" : displayedRecipeCount >= 3 ? "新帽子進度" : displayedRecipeCount >= 2 ? "料理背景框" : "地瓜貼紙";

  return (
    <main className={`game ${stage} ${difficulty}`} onPointerDownCapture={unlockSound}>
      <header>
        <div className="logo"><span>🍠</span> 地瓜飯小廚師</div>
        <div className="header-actions">
          {stage !== "home" && stage !== "done" && (
            <button className="game-menu-button" aria-label="開啟遊戲選單" onClick={() => setGameMenuOpen(true)}>☰<small>選單</small></button>
          )}
          <button
            className={`parent-lock ${holdingParent ? "holding" : ""}`}
            aria-label="按住開啟家長設定"
            onPointerDown={() => {
              setHoldingParent(true);
              parentHold.current = window.setTimeout(() => { setParentOpen(true); setHoldingParent(false); }, 1200);
            }}
            onPointerUp={() => { setHoldingParent(false); if (parentHold.current) clearTimeout(parentHold.current); }}
            onPointerCancel={() => { setHoldingParent(false); if (parentHold.current) clearTimeout(parentHold.current); }}
          >⚙️<small>按住</small></button>
          <button
            className="sound"
            aria-label={sound ? "關閉聲音" : "開啟聲音"}
            onClick={() => {
              const next = !sound;
              setSound(next);
              if (next) {
                const text = language === "taiwanese" ? taiwanesePrompts[stage] : prompts[stage];
                setTimeout(() => speak(text, true, language), 30);
              }
              else {
                activeVoice?.pause();
                window.speechSynthesis?.cancel();
              }
            }}
          >{sound ? "🔊" : "🔇"}</button>
        </div>
      </header>

      {step >= 0 && (
        <nav aria-label="遊戲進度">
          {activeStages.map((item, i) =>
            <i className={i < step ? "done" : i === step ? "now" : ""} key={item}>
              {i < step ? "✓" : i + 1}
            </i>
          )}
        </nav>
      )}

      <section className="card">
        {stage === "home" && (
          <div className="home-screen">
            <span className="sun" />
            <span className="cloud c1">☁</span><span className="cloud c2">☁</span>
            <div className="mascot"><span className="hat">{hatEmoji}</span><Potato clean /></div>
            <h1>地瓜飯<br />小廚師</h1>
            <p>找一找・洗一洗・煮香香</p>
            <span className="version-badge">v5.2 訂單挑戰版</span>
            <div className="home-options">
              <button className={gameMode === "quick" ? "selected" : ""} onClick={() => setGameMode("quick")}>⚡ 快速料理</button>
              <button className={gameMode === "full" ? "selected" : ""} onClick={() => setGameMode("full")}>🍳 完整料理</button>
            </div>
            <div className="language-switch" aria-label="語音語言">
              <button className={language === "mandarin" ? "selected" : ""} onClick={() => setLanguage("mandarin")}>國語</button>
              <button className={language === "taiwanese" ? "selected" : ""} onClick={() => setLanguage("taiwanese")}>台語</button>
            </div>
            <small className="mode-note">{gameMode === "quick" ? "快速料理會自動完成洗米與食材入鍋" : "完整體驗洗米、拖放食材等所有步驟"}</small>
            <button className="big start" onClick={startGame}>▶ 開始玩</button>
            <div className="home-secondary">
              <button className="sticker-book-button" onClick={() => setStickerBookOpen(true)}>📒 我的貼紙簿<strong>{stickerTotal}</strong></button>
              <button className="outfit-button" onClick={() => setOutfitOpen(true)}>👕 幫小廚師換裝</button>
            </div>
          </div>
        )}

        {step >= 0 && (
          <div className="heading">
            <b>第 {step + 1} 關</b>
            <h1>{titles[stage]}</h1>
            <button onClick={() => {
              const text = language === "taiwanese" ? taiwanesePrompts[stage] : prompts[stage];
              speak(text, sound, language);
            }}>🔊 再聽一次</button>
          </div>
        )}

        {step >= 0 && (
          <div className="potato-helper" aria-live="polite">
            <Potato clean tiny /><span>{language === "taiwanese" ? "我來鬥相共！" : "我來幫你！"}</span>
          </div>
        )}

        {stage === "choose" && (
          <div className="scene choose-scene">
            <p className="hint">今天想煮哪一種地瓜？</p>
            <div className="recipe-list">
              {recipes.map(item => (
                <button className="recipe-card" key={item.id} onClick={() => chooseRecipe(item)}>
                  <span className="recipe-potato" style={{ background: item.color }}>🍠</span>
                  <b>{item.name}</b>
                  <small>{item.sticker} 可收集貼紙</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "find" && (
          <div className="scene garden">
            <strong className="counter">🍠 {found.length} / 3</strong>
            {difficulty === "challenge" && <div className="challenge-badge">挑戰：由大到小找</div>}
            <span className="plant p1">🎃</span><span className="plant p2">🌻</span><span className="plant p3">🌿</span>
            {[1, 2, 3].map(id =>
              <button
                key={id}
                className={`hidden-potato hp${id} ${found.includes(id) ? "found" : ""}`}
                aria-label={`找到第${id}條地瓜`}
                onClick={() => findPotato(id)}
              ><Potato /></button>
            )}
            {learningMessage && <div className="coach-message">💡 {learningMessage}</div>}
          </div>
        )}

        {stage === "order" && (
          <div className="scene order-scene">
            <div className="mission-card"><b>📋 今日小任務</b><span>{difficulty === "challenge" ? "由大到小找地瓜，照順序完成料理" : "記住客人的地瓜與配料，完成專屬料理"}</span></div>
            <div className="order-guest"><span>{orderGuest.emoji}</span><b>{orderGuest.name}</b><small>{orderGuest.line}</small></div>
            <div className="speech-bubble">
              我想吃香香的<br /><strong>{recipe.name}飯！</strong><br />
              再加一點 <em>{orderTopping.emoji} {orderTopping.name}</em>
            </div>
            <button className="big" onClick={() => go("find")}>收到！開始做</button>
          </div>
        )}

        {stage === "wash" && (
          <div className="scene wash-scene">
            <span className="faucet">🚰</span><i className="water" />
            <div
              className="wash-zone"
              role="slider"
              aria-label="用手指搓洗地瓜"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(washed)}
              onPointerDown={startWash}
              onPointerMove={moveWash}
              onPointerUp={stopWash}
              onPointerCancel={stopWash}
            >
              <Potato clean={washed >= 100} />
              <i className="wash-mud mud-a" style={{ opacity: Math.max(0, 1 - washed / 34) }} />
              <i className="wash-mud mud-b" style={{ opacity: Math.max(0, 1 - washed / 62) }} />
              <i className="wash-mud mud-c" style={{ opacity: Math.max(0, 1 - washed / 94) }} />
              <span className="sponge">🧽</span>
              {[0,1,2,3].map(i => <i className={`bubble b${i}`} key={i}>○</i>)}
            </div>
            <div className="wash-progress" aria-hidden="true"><i style={{ width: `${washed}%` }} /></div>
            <p className="hint">👆 按住地瓜，來回搓洗</p>
            <button className="easy-action" onClick={tapWash}>點一下也可以洗 🧽</button>
          </div>
        )}

        {stage === "cut" && (
          <div className="scene cut-scene">
            <div className="board">
              {cut < 3 ? (
                <div
                  className="cut-potato"
                  role="button"
                  tabIndex={0}
                  aria-label={`在地瓜上滑動切塊，已完成 ${cut} 刀`}
                  onPointerDown={startCut}
                  onPointerUp={finishCut}
                  onPointerCancel={() => { cutStart.current = null; }}
                  onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); tapCut(); } }}
                >
                  <div className="cut-flesh" />
                  {[0,1,2].map(line => (
                    <span
                      key={line}
                      className={`cut-track line-${line} ${line < cut ? "sliced" : line === cut ? "active" : "waiting"}`}
                    >
                      {line === cut && <span className="finger-guide">👇</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="cube-pile">
                  {Array.from({ length: 8 }).map((_, index) => <PotatoCube index={index} key={index} />)}
                </div>
              )}
            </div>
            <p className="hint">{cut < 3 ? `👇 在地瓜上往下滑（${cut}/3）` : "地瓜變成方塊啦！"}</p>
            {cut < 3 && <button className="easy-action" onClick={tapCut}>點一下切一刀</button>}
            <strong className="safe">小朋友不碰真的刀子喔！</strong>
          </div>
        )}

        {stage === "rinse" && (
          <div className="scene rinse-scene">
            <div
              className="rice-bowl"
              role="slider"
              aria-label="繞圈清洗白米"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(rinsed)}
              onPointerDown={startRinse}
              onPointerMove={moveRinse}
              onPointerUp={() => { rinsePoint.current = null; }}
              onPointerCancel={() => { rinsePoint.current = null; }}
            >
              <div className="rice-water" style={{ opacity: .9 - rinsed * .005 }} />
              <span className="rice-grains">••••••••••<br />•••••••••</span>
              <span className="circle-guide">↻</span>
            </div>
            <div className="wash-progress" aria-hidden="true"><i style={{ width: `${rinsed}%` }} /></div>
            <p className="hint">☝️ 在白米上繞圈圈（{Math.round(rinsed)}%）</p>
            <button className="easy-action" onClick={() => {
              const next = Math.min(100, rinsed + 25);
              setRinsed(next); ping();
              if (next >= 100) setTimeout(() => go("mix"), 700);
            }}>點一下也可以洗米 🍚</button>
          </div>
        )}

        {stage === "mix" && (
          <div className="scene mix-scene">
            <button
              className={`food ${food.includes("rice") ? "added" : ""}`}
              onPointerDown={event => startFoodDrag("rice", event)}
              onPointerMove={moveFoodDrag}
              onPointerUp={finishFoodDrag}
              onPointerCancel={() => setDraggingFood(null)}
              onClick={() => addFood("rice")}
            >
              <span>🍚</span><b>白米</b>
            </button>
            <button
              className={`food ${food.includes("potato") ? "added" : ""}`}
              onPointerDown={event => startFoodDrag("potato", event)}
              onPointerMove={moveFoodDrag}
              onPointerUp={finishFoodDrag}
              onPointerCancel={() => setDraggingFood(null)}
              onClick={() => addFood("potato")}
            >
              <span className="mini-cubes">▰ ▰ ▰</span><b>地瓜塊</b>
            </button>
            <div className="cooker" ref={potRef}>
              <i className="lid" /><div className="pot">
                {food.includes("rice") && <span>🍚</span>}
                {food.includes("potato") && <span className="pot-cubes">▪▪▪</span>}
              </div>
            </div>
            {draggingFood && (
              <span className="drag-ghost" style={{ left: draggingFood.x, top: draggingFood.y }}>
                {draggingFood.item === "rice" ? "🍚" : "▰"}
              </span>
            )}
            <p className="hint">👆 按住食材，拖進鍋子</p>
            {learningMessage && <div className="coach-message mix-coach">💡 {learningMessage}</div>}
          </div>
        )}

        {stage === "cook" && (
          <div className="scene cook-scene">
            <div className={`big-cooker ${timer < 3 ? "cooking" : ""}`}>
              <i className="steam s1">〰</i><i className="steam s2">〰</i>
              <i className="lid" /><div className="pot"><b>{timer === 0 ? "好囉！" : timer}</b></div>
            </div>
            <button className="big" disabled={timer < 3} onClick={cookRice}>
              {timer === 3 ? "🍲 煮飯飯" : "咕嚕咕嚕…"}
            </button>
          </div>
        )}

        {stage === "serve" && (
          <div className="scene serve-scene">
            <div className="meal">🍚<span style={{ filter: `drop-shadow(0 0 7px ${recipe.color})` }}>🍠</span>{chosenTopping && <i>{chosenTopping.emoji}</i>}</div>
            <p className="hint">把地瓜飯送給 {orderGuest.name}</p>
            <button className={`guest ${guest ? "chosen" : ""}`} onClick={() => serve(orderGuest.name)}>
              <span>{orderGuest.emoji}</span><b>{orderGuest.name}</b>
            </button>
          </div>
        )}

        {stage === "decorate" && (
          <div className="scene decorate-scene">
            <div className="order-reminder">
              {orderGuest.emoji} 想要 <strong>{orderTopping.emoji} {orderTopping.name}</strong>
            </div>
            <div className="decorate-meal">
              🍚<span>🍠</span>{chosenTopping && <i>{chosenTopping.emoji}</i>}
            </div>
            <p className="hint">選出正確的配料</p>
            <div className="topping-list">
              {toppings.map(topping => (
                <button key={topping.id} onClick={() => chooseTopping(topping)}>
                  <span>{topping.emoji}</span><b>{topping.name}</b>
                </button>
              ))}
            </div>
            {learningMessage && <div className="coach-message">💡 {learningMessage}</div>}
          </div>
        )}

        {stage === "done" && (
          <div className="done-screen">
            <div className="confetti">{Array.from({length: 18}).map((_,i) => <i key={i} />)}</div>
            <span className="star">⭐</span>
            <h1>地瓜飯完成啦！</h1>
            <div className="friends">{orderGuest.emoji}</div>
            <div className="meal">🍚<span style={{ filter: `drop-shadow(0 0 7px ${recipe.color})` }}>🍠</span>{chosenTopping && <i>{chosenTopping.emoji}</i>}</div>
            <p className="celebration-line">💛 {celebration}</p>
            <div className="three-stars" aria-label="獲得三星評價"><i>⭐<small>完成料理</small></i><i>⭐<small>符合訂單</small></i><i>⭐<small>安全操作</small></i></div>
            <div className="sticker"><span>{recipe.sticker}</span><b>獲得「{recipe.name}」貼紙！</b><small>本料理收藏 {displayedRecipeCount} 次・里程碑：{milestone}</small></div>
            <button className="big" onClick={reset}>↻ 再玩一次</button>
          </div>
        )}
      </section>
      {gameMenuOpen && (
        <div className="parent-overlay" role="dialog" aria-modal="true" aria-label="遊戲選單">
          <div className="parent-panel game-menu-panel">
            <button className="close-parent" onClick={() => setGameMenuOpen(false)}>✕</button>
            <h2>🍠 遊戲選單</h2>
            <p>目前進度會保留，選擇要怎麼繼續。</p>
            <button className="menu-choice" onClick={() => setGameMenuOpen(false)}>▶ 繼續料理</button>
            <button className="menu-choice" onClick={() => { setGameMenuOpen(false); setStage("order"); }}>↻ 重看訂單</button>
            <button className="menu-choice home-choice" onClick={() => { setGameMenuOpen(false); reset(); }}>⌂ 回到首頁</button>
          </div>
        </div>
      )}
      {outfitOpen && (
        <div className="sticker-overlay" role="dialog" aria-modal="true" aria-label="幫小廚師換裝">
          <div className="outfit-panel">
            <button className="close-parent" onClick={() => setOutfitOpen(false)}>✕</button>
            <h2>👕 幫小廚師換裝</h2>
            <p>收集貼紙可以解鎖新帽子！</p>
            <div className="outfit-list">
              {outfits.map(item => {
                const unlocked = stickerTotal >= item.need;
                return (
                  <button
                    key={item.name}
                    disabled={!unlocked}
                    className={outfit === item.name ? "wearing" : ""}
                    onClick={() => { setOutfit(item.name); ping(true); }}
                  >
                    <span>{unlocked ? item.icon : "🔒"}</span>
                    <b>{item.name}</b>
                    <small>{unlocked ? (outfit === item.name ? "穿戴中" : "點一下穿上") : `需要 ${item.need} 張貼紙`}</small>
                  </button>
                );
              })}
            </div>
            <button className="parent-done" onClick={() => setOutfitOpen(false)}>換裝完成</button>
          </div>
        </div>
      )}
      {stickerBookOpen && (
        <div className="sticker-overlay" role="dialog" aria-modal="true" aria-label="我的貼紙簿">
          <div className="sticker-panel">
            <button className="close-parent" onClick={() => setStickerBookOpen(false)}>✕</button>
            <h2>📒 我的地瓜貼紙簿</h2>
            <p>每完成一次料理，就能收藏一張貼紙！</p>
            <div className="sticker-pages">
              {recipes.map(item => {
                const count = stickers[item.id] || 0;
                return (
                  <article className={count ? "collected" : "empty"} key={item.id}>
                    <span>{count ? item.sticker : "？"}</span>
                    <b>{item.name}</b>
                    <small>{count ? `已收藏 ${count} 張` : "還沒收集到"}</small>
                    <div className="milestone-row">
                      {[1, 2, 3, 5, 10].map(value => <i className={count >= value ? "earned" : ""} key={value}>{count >= value ? "★" : "☆"}<small>{value}</small></i>)}
                    </div>
                    <em>{count >= 10 ? "地瓜大師" : count >= 5 ? "金色貼紙" : count >= 3 ? "帽子進度" : count >= 2 ? "背景框" : count >= 1 ? "已解鎖貼紙" : "等待解鎖"}</em>
                  </article>
                );
              })}
            </div>
            <div className="collection-progress">
              收藏進度 <strong>{Object.keys(stickers).filter(key => stickers[key] > 0).length} / {recipes.length}</strong>
            </div>
            <button className="parent-done" onClick={() => setStickerBookOpen(false)}>繼續玩</button>
          </div>
        </div>
      )}
      {parentOpen && (
        <div className="parent-overlay" role="dialog" aria-modal="true" aria-label="家長設定">
          <div className="parent-panel">
            <button className="close-parent" onClick={() => setParentOpen(false)}>✕</button>
            <h2>家長設定</h2>
            <label>遊戲難度
              <select value={difficulty} onChange={event => setDifficulty(event.target.value as "easy" | "challenge")}>
                <option value="easy">輕鬆玩（適合初次）</option>
                <option value="challenge">小挑戰（大小與順序）</option>
              </select>
            </label>
            <label>料理模式
              <select value={gameMode} onChange={event => setGameMode(event.target.value as "quick" | "full")}>
                <option value="quick">快速料理（約 3 分鐘）</option>
                <option value="full">完整料理（約 5–7 分鐘）</option>
              </select>
            </label>
            <label>語音語言
              <select value={language} onChange={event => setLanguage(event.target.value as "mandarin" | "taiwanese")}>
                <option value="mandarin">國語</option>
                <option value="taiwanese">台語</option>
              </select>
            </label>
            <h3>貼紙收藏</h3>
            <div className="sticker-book">
              {recipes.map(item => <span key={item.id}>{item.sticker}<b>{stickers[item.id] || 0}</b></span>)}
            </div>
            <button className="parent-done" onClick={() => setParentOpen(false)}>設定完成</button>
          </div>
        </div>
      )}
      <footer>適合親子一起玩・請大人陪伴小朋友</footer>
    </main>
  );
}
