"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Stage = "home" | "choose" | "order" | "find" | "wash" | "cut" | "rinse" | "mix" | "cook" | "decorate" | "serve" | "done";
type Recipe = { id: string; name: string; color: string; sticker: string };
type Topping = { id: string; name: string; emoji: string };

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
];
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

function deviceSpeech(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const engine = window.speechSynthesis;
  engine.cancel();
  engine.resume();
  const line = new SpeechSynthesisUtterance(text);
  const voices = engine.getVoices();
  const voice =
    voices.find(item => item.lang.toLowerCase() === "zh-tw") ||
    voices.find(item => item.lang.toLowerCase() === "zh-hk") ||
    voices.find(item => item.lang.toLowerCase() === "zh-cn") ||
    voices.find(item => item.lang.toLowerCase().startsWith("zh"));
  if (voice) line.voice = voice;
  line.lang = voice?.lang || "zh-TW";
  line.volume = 1;
  line.rate = 0.84;
  line.pitch = 1.12;
  engine.speak(line);
}

function speak(text: string, enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  activeVoice?.pause();

  const file = voiceFileFor(text);
  if (!file) {
    deviceSpeech(text);
    return;
  }
  const audio = new Audio(`/voice/${file}.mp3`);
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
  const [orderGuest, setOrderGuest] = useState(["小熊", "🐻"]);
  const [orderTopping, setOrderTopping] = useState<Topping>(toppings[0]);
  const [chosenTopping, setChosenTopping] = useState<Topping | null>(null);
  const [recipe, setRecipe] = useState<Recipe>(recipes[0]);
  const [difficulty, setDifficulty] = useState<"easy" | "challenge">("easy");
  const [parentOpen, setParentOpen] = useState(false);
  const [stickerBookOpen, setStickerBookOpen] = useState(false);
  const [stickers, setStickers] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    const saved = window.localStorage.getItem("sweet-potato-stickers");
    return saved ? JSON.parse(saved) : {};
  });
  const [learningMessage, setLearningMessage] = useState("");
  const [draggingFood, setDraggingFood] = useState<{ item: string; x: number; y: number } | null>(null);
  const washing = useRef(false);
  const washPoint = useRef({ x: 0, y: 0 });
  const cutStart = useRef<{ x: number; y: number } | null>(null);
  const rinsePoint = useRef<{ x: number; y: number } | null>(null);
  const potRef = useRef<HTMLDivElement | null>(null);
  const parentHold = useRef<number | null>(null);
  const awarded = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);

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
    if (stage !== "done" || awarded.current) return;
    awarded.current = true;
    setStickers(current => {
      const next = { ...current, [recipe.id]: (current[recipe.id] || 0) + 1 };
      window.localStorage.setItem("sweet-potato-stickers", JSON.stringify(next));
      return next;
    });
  }, [stage, recipe.id]);

  useEffect(() => {
    if (stage === "home") return;
    const id = window.setTimeout(() => speak(prompts[stage], sound), 250);
    return () => clearTimeout(id);
  }, [stage, sound]);

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
    awarded.current = false;
    go("home");
  }

  function startGame() {
    const guests = [["小熊", "🐻"], ["小兔", "🐰"], ["小狗", "🐶"]];
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    setOrderGuest(guests[random[0] % guests.length]);
    unlockSound();
    speak("開始做地瓜飯！", sound);
    go("choose");
  }

  function chooseRecipe(nextRecipe: Recipe) {
    setRecipe(nextRecipe);
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    setOrderTopping(toppings[random[0] % toppings.length]);
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
      setTimeout(() => go("rinse"), 1200);
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

  const step = stages.indexOf(stage);

  return (
    <main className={`game ${stage} ${difficulty}`} onPointerDownCapture={unlockSound}>
      <header>
        <div className="logo"><span>🍠</span> 地瓜飯小廚師</div>
        <div className="header-actions">
          <button
            className="parent-lock"
            aria-label="按住開啟家長設定"
            onPointerDown={() => { parentHold.current = window.setTimeout(() => setParentOpen(true), 1200); }}
            onPointerUp={() => { if (parentHold.current) clearTimeout(parentHold.current); }}
            onPointerCancel={() => { if (parentHold.current) clearTimeout(parentHold.current); }}
          >⚙️<small>按住</small></button>
          <button
            className="sound"
            aria-label={sound ? "關閉聲音" : "開啟聲音"}
            onClick={() => {
              const next = !sound;
              setSound(next);
              if (next) setTimeout(() => speak(prompts[stage]), 30);
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
          {stages.map((item, i) =>
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
            <div className="mascot"><span className="hat">☁</span><Potato clean /></div>
            <h1>地瓜飯<br />小廚師</h1>
            <p>找一找・洗一洗・煮香香</p>
            <button className="big start" onClick={startGame}>▶ 開始玩</button>
            <button className="sticker-book-button" onClick={() => setStickerBookOpen(true)}>
              📒 我的貼紙簿
              <strong>{Object.values(stickers).reduce((sum, count) => sum + count, 0)}</strong>
            </button>
          </div>
        )}

        {step >= 0 && (
          <div className="heading">
            <b>第 {step + 1} 關</b>
            <h1>{titles[stage]}</h1>
            <button onClick={() => speak(prompts[stage], sound)}>🔊 再聽一次</button>
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
            <div className="order-guest"><span>{orderGuest[1]}</span><b>{orderGuest[0]}</b></div>
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
            >
              <span>🍚</span><b>白米</b>
            </button>
            <button
              className={`food ${food.includes("potato") ? "added" : ""}`}
              onPointerDown={event => startFoodDrag("potato", event)}
              onPointerMove={moveFoodDrag}
              onPointerUp={finishFoodDrag}
              onPointerCancel={() => setDraggingFood(null)}
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
            <p className="hint">把地瓜飯送給點餐的客人</p>
            <button className={`guest ${guest ? "chosen" : ""}`} onClick={() => serve(orderGuest[0])}>
              <span>{orderGuest[1]}</span><b>{orderGuest[0]}</b>
            </button>
          </div>
        )}

        {stage === "decorate" && (
          <div className="scene decorate-scene">
            <div className="order-reminder">
              {orderGuest[1]} 想要 <strong>{orderTopping.emoji} {orderTopping.name}</strong>
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
            <div className="friends">{orderGuest[1]}</div>
            <div className="meal">🍚<span style={{ filter: `drop-shadow(0 0 7px ${recipe.color})` }}>🍠</span>{chosenTopping && <i>{chosenTopping.emoji}</i>}</div>
            <p>你是最棒的小廚師！</p>
            <div className="sticker"><span>{recipe.sticker}</span><b>獲得「{recipe.name}」貼紙！</b></div>
            <button className="big" onClick={reset}>↻ 再玩一次</button>
          </div>
        )}
      </section>
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
                    <div>{Array.from({ length: 3 }).map((_, index) => <i key={index}>{index < count ? "★" : "☆"}</i>)}</div>
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
