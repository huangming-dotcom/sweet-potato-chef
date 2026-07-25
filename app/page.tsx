"use client";

import { useEffect, useState } from "react";

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
  wash: "點點地瓜五下，把泥巴洗乾淨。",
  cut: "拍拍地瓜，請大人幫忙變成小塊。",
  mix: "把白飯和地瓜都放進鍋子裡。",
  cook: "按下大大的煮飯按鈕。",
  serve: "選一位客人，請他吃地瓜飯。",
  done: "好香的地瓜飯，你是最棒的小廚師！",
};

function speak(text: string, enabled = true) {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const line = new SpeechSynthesisUtterance(text);
  line.lang = "zh-TW";
  line.rate = 0.84;
  line.pitch = 1.12;
  window.speechSynthesis.speak(line);
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

export default function Home() {
  const [stage, setStage] = useState<Stage>("home");
  const [sound, setSound] = useState(true);
  const [found, setFound] = useState<number[]>([]);
  const [washed, setWashed] = useState(0);
  const [cut, setCut] = useState(0);
  const [food, setFood] = useState<string[]>([]);
  const [timer, setTimer] = useState(3);
  const [guest, setGuest] = useState("");

  useEffect(() => {
    if (stage === "home") return;
    const id = window.setTimeout(() => speak(prompts[stage], sound), 250);
    return () => clearTimeout(id);
  }, [stage, sound]);

  function ping(win = false) {
    if (!sound) return;
    const AudioCtx = window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
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

  function washPotato() {
    const next = Math.min(washed + 1, 5);
    setWashed(next); ping();
    if (next === 5) {
      speak("洗得亮晶晶！", sound);
      setTimeout(() => go("cut"), 750);
    }
  }

  function cutPotato() {
    const next = Math.min(cut + 1, 4);
    setCut(next); ping();
    if (next === 4) {
      speak("地瓜變成小塊了！", sound);
      setTimeout(() => go("mix"), 750);
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
    <main className={`game ${stage}`}>
      <header>
        <div className="logo"><span>🍠</span> 地瓜飯小廚師</div>
        <button
          className="sound"
          aria-label={sound ? "關閉聲音" : "開啟聲音"}
          onClick={() => {
            const next = !sound;
            setSound(next);
            if (next) setTimeout(() => speak(prompts[stage]), 30);
            else window.speechSynthesis?.cancel();
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
            <button className="big start" onClick={() => go("find")}>▶ 開始玩</button>
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
            <button className="target" aria-label="點地瓜清洗" onClick={washPotato}>
              <Potato clean={washed === 5} />
              {washed < 5 && Array.from({ length: washed }).map((_, i) => <i className={`bubble b${i}`} key={i}>○</i>)}
            </button>
            <div className="meter">{[0,1,2,3,4].map(i => <i className={i < washed ? "on" : ""} key={i}>●</i>)}</div>
            <p className="hint">點地瓜 5 下</p>
          </div>
        )}

        {stage === "cut" && (
          <div className="scene cut-scene">
            <div className="board">
              <button className="target" aria-label="拍拍地瓜變成小塊" onClick={cutPotato}>
                {cut === 0 ? <Potato clean /> :
                  <span className="pieces">{Array.from({length: cut + 1}).map((_,i) => <Potato clean tiny key={i} />)}</span>}
              </button>
            </div>
            <p className="hint">拍拍地瓜，請大人幫忙切</p>
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
