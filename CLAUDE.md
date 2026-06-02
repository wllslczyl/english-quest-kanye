# Kanye English Quest — Project Map

## Quick Start
Open `index.html` in browser. No build step. All data in localStorage (`eq_v8`, `eq_apikey`).

## File Roles
| File | What It Does | Edit With Care? |
|------|-------------|:--:|
| `index.html` | Entry point, loads all JS/CSS in order | Only to add new scripts |
| `config.js` | Game constants (monsters, weapons, achievements, balance, Kanye quotes) | Constants only |
| `questions.js` | 256 questions across 4 levels | JSON array, careful with commas |
| `words.js` | English→Chinese dictionary (WD) + sentence translations (SC) | Key-value pairs |
| `main.js` | State (S), save/load, menu rendering, XP/level system | Core logic, high risk |
| `battle.js` | Battle system: question rendering, answer grading, GSAP animations | High risk |
| `chat.js` | AI chat with DeepSeek API, streaming, TTS, translation | API key handling |
| `audio.js` | Web Speech TTS for listening questions + speakTTS() helper | Stable |
| `sidebar.js` | Album sidebar: render, theme switching | Stable |
| `review.js` | Stats page: weekly chart, wrong answer list | Stable |
| `style.css` | All visual styles, CSS animations, badge/boss/particle styles | CSS only |
| `eq_save.json` | Player save data (localStorage backup) | Auto-generated |

## State Object (`S` in main.js)
- Saved to localStorage on every change
- Keys to keep when adding new state: `level, xp, hp, mhp, mp, mmp, streak, mxStreak, ok, ng, wins, losses, today, todayOK, todayNG, wrongList, history, badges, bossKills, chatCount, reviewCount`

## Editing Tips (prevent wasted rounds)
- **Indentation is inconsistent**: Some files use tabs, others 4 spaces. Match what's there.
- **Variable scope**: All variables are global (`var`), no ES6 modules. A function in battle.js can read `S` from main.js.
- **`esc()` function** in main.js: always use it when inserting user text into HTML.
- **GSAP** loaded via CDN in index.html. Check `typeof gsap !== 'undefined'` before using.
- **Animation functions** live in `battle.js` lines 38-125: `shakeScreen(intensity)`, `floatDmg(text, color, scale)`, `flashMonster()`, `elasticHPBar()`, `sparkBurst(x, y, count, color)`, `streakGlow(level)`, `bossEntrance()`

## Questions Format
```json
{"q":"question text","a":"correct answer","o":["wrong1","wrong2","wrong3","correct"],"t":"vocab|grammar|spelling|sentence|listening","s":"optional chinese hint","speak":"for listening type"}
```

## Adding Content
- **New monsters**: Add to `MONSTERS` array in config.js
- **New achievements**: Add to `ACHIEVEMENTS` array + condition function
- **New questions**: Add to `QQ` object in questions.js under correct level
- **New chat scenes**: Add to `CHAT_SCENES` in config.js
- **New weapons**: Add to `WEAPONS` with `dmg` and `lv` (unlock level)
