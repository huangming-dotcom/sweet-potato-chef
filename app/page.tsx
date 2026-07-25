"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Stage = "home" | "find" | "wash" | "cut" | "mix" | "cook" | "serve" | "done";

const stages: Stage[] = ["find", "wash", "cut", "mix", "cook", "serve"];
const titles: Record<Stage, string> = {
  home: "地瓜飯小廚師",
  find: "找地瓜",
  wash: "洗一洗",
  cut: "變小塊",
  mix: "放進鍋",
  cook: "煮飯飯",
  serve: "請客人吃",
  done: "完成啦",
};
const prompts: Record<Stage, string> = {
  home: "歡迎來到地瓜飯小廚師，按下開始玩。",
  find: "找一找，三條地瓜藏在哪裡？",
  wash: "用手指在地瓜上來回搓一搓，把泥巴洗乾淨。",
  cut: "用手指沿著虛線往下切，把地瓜切成小方塊。",
  mix: "把白飯和地瓜都放進鍋子裡。",
  cook: "按下大大的煮飯按鈕。",
  serve: "選一位客人，請他吃地瓜飯。",
  done: "好香的地瓜飯，你是最棒的小廚師！",
};

let activeVoice: HTMLAudioElement | null = null;

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

  const naturalVoiceUrl =
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-TW&q=${encodeURIComponent(text)}`;
  const audio = new Audio(naturalVoiceUrl);
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.setAttribute("referrerpolicy", "no-referrer");
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
  const [food, setFood] = useState<string[]>([]);
  const [timer, setTimer] = useState(3);
  const [guest, setGuest] = useState("");
  const washing = useRef(false);
  const washPoint = useRef({ x: 0, y: 0 });
  const cutStart = useRef<{ x: number; y: number } | null>(null);
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
    setFound([]); setWashed(0); setCut(0); setFood([]); setTimer(3); setGuest("");
    go("home");
  }

  function findPotato(id: number) {
    if (found.includes(id)) return;
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
      setTimeout(() => go("mix"), 1200);
    }
  }

  function addFood(item: string) {
    if (food.includes(item)) return;
    const next = [...food, item];
    setFood(next); ping();
    speak(item === "rice" ? "白飯進鍋！" : "地瓜進鍋！", sound);
    if (next.length === 2) setTimeout(() => go("cook"), 750);
  }

  function cookRice() {
    if (timer < 3) return;
    speak("三、二、一，地瓜飯快快熟！", sound);
    [2, 1, 0].forEach((value, index) => setTimeout(() => {
      setTimer(value);
      ping(value === 0);
      if (value === 0) {
        speak("叮！地瓜飯煮好囉！", sound);
        setTimeout(() => setStage("serve"), 900);
      }
    }, 850 * (index + 1)));
  }

  function serve(name: string) {
    setGuest(name); ping(true);
    speak(`${name}說，好香、好好吃，謝謝小廚師！`, sound);
    setTimeout(() => setStage("done"), 1200);
  }

  const step = stages.indexOf(stage);

  return (
    <main className={`game ${stage}`} onPointerDownCapture={unlockSound}>
      <header>
        <div className="logo"><span>🍠</span> 地瓜飯小廚師</div>
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
            <button className="big start" onClick={() => {
              unlockSound();
              speak("開始做地瓜飯！", sound);
              go("find");
            }}>▶ 開始玩</button>
          </div>
        )}

        {step >= 0 && (
          <div className="heading">
            <b>第 {step + 1} 關</b>
            <h1>{titles[stage]}</h1>
            <button onClick={() => speak(prompts[stage], sound)}>🔊 再聽一次</button>
          </div>
        )}

        {stage === "find" && (
          <div className="scene garden">
            <strong className="counter">🍠 {found.length} / 3</strong>
            <span className="plant p1">🎃</span><span className="plant p2">🌻</span><span className="plant p3">🌿</span>
            {[1, 2, 3].map(id =>
              <button
                key={id}
                className={`hidden-potato hp${id} ${found.includes(id) ? "found" : ""}`}
                aria-label={`找到第${id}條地瓜`}
                onClick={() => findPotato(id)}
              ><Potato /></button>
            )}
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

        {stage === "mix" && (
          <div className="scene mix-scene">
            <button className={`food ${food.includes("rice") ? "added" : ""}`} onClick={() => addFood("rice")}>
              <span>🍚</span><b>白飯</b>
            </button>
            <button className={`food ${food.includes("potato") ? "added" : ""}`} onClick={() => addFood("potato")}>
              <span>🍠</span><b>地瓜</b>
            </button>
            <div className="cooker">
              <i className="lid" /><div className="pot">
                {food.includes("rice") && <span>🍚</span>}
                {food.includes("potato") && <span>🍠</span>}
              </div>
            </div>
            <p className="hint">兩樣都點一下</p>
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
            <div className="meal">🍚<span>🍠</span></div>
            <p className="hint">誰要吃地瓜飯？</p>
            <div className="guests">
              {[["小熊","🐻"],["小兔","🐰"],["小狗","🐶"]].map(([name, emoji]) =>
                <button className={`guest ${guest === name ? "chosen" : ""}`} key={name} onClick={() => serve(name)}>
                  <span>{emoji}</span><b>{name}</b>
                </button>
              )}
            </div>
          </div>
        )}

        {stage === "done" && (
          <div className="done-screen">
            <div className="confetti">{Array.from({length: 18}).map((_,i) => <i key={i} />)}</div>
            <span className="star">⭐</span>
            <h1>地瓜飯完成啦！</h1>
            <div className="friends">🐻 🐰 🐶</div>
            <div className="meal">🍚<span>🍠</span></div>
            <p>你是最棒的小廚師！</p>
            <button className="big" onClick={reset}>↻ 再玩一次</button>
          </div>
        )}
      </section>
      <footer>適合親子一起玩・請大人陪伴小朋友</footer>
    </main>
  );
}
