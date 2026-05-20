const EIGHT_BALL_ANSWERS = [
  "It is certain.",
  "Without a doubt.",
  "Yes, definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

const JOKES = [
  "Why don't scientists trust atoms? Because they make up everything.",
  "I told my computer I needed a break. It said: 'No problem, I'll go to sleep.'",
  "Why did the developer go broke? Because he used up all his cache.",
  "There are 10 types of people in the world: those who understand binary and those who don't.",
  "Debugging: being the detective in a crime movie where you are also the murderer.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "I would tell you a UDP joke, but you might not get it.",
  "How many programmers does it take to change a light bulb? None — it's a hardware problem.",
  "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
  "I don't trust stairs. They're always up to something.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "Why did the coffee file a police report? It got mugged."
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function rollDice(spec) {
  let times = 1;
  let sides = 6;

  const match = String(spec || "").trim().toLowerCase().match(/^(\d{1,2})?d(\d{1,3})$/);
  if (match) {
    times = match[1] ? Math.max(1, Math.min(20, Number(match[1]))) : 1;
    sides = Math.max(2, Math.min(120, Number(match[2])));
  }

  const rolls = [];
  for (let i = 0; i < times; i += 1) {
    rolls.push(1 + Math.floor(Math.random() * sides));
  }

  const total = rolls.reduce((sum, x) => sum + x, 0);
  const detail = times > 1 ? ` (${rolls.join(" + ")} = ${total})` : "";
  return `🎲 rolled ${times}d${sides}: ${total}${detail}`;
}

function flipCoin() {
  return Math.random() < 0.5 ? "🪙 Coin flip: Heads" : "🪙 Coin flip: Tails";
}

function eightBall(question) {
  const q = String(question || "").trim();
  const answer = pick(EIGHT_BALL_ANSWERS);
  if (!q) return `🎱 ${answer}`;
  return `🎱 Q: ${q}\nA: ${answer}`;
}

function clapify(text) {
  const value = String(text || "").trim();
  if (!value) return null;
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return value;
  return parts.join(" 👏 ");
}

function meAction(text, displayName) {
  const action = String(text || "").trim();
  if (!action) return null;
  const who = String(displayName || "").trim() || "someone";
  return `* ${who} ${action} *`;
}

export const SLASH_HELP_LINES = [
  "🎲  /roll [NdM] — roll dice (default 1d6)",
  "🪙  /flip — flip a coin",
  "🎱  /8ball <question> — ask the magic 8-ball",
  "😄  /joke — random joke",
  "🎭  /me <action> — describe an action",
  "🤷  /shrug — ¯\\_(ツ)_/¯",
  "🙃  /tableflip — (╯°□°)╯︵ ┻━┻",
  "🙂  /unflip — ┬─┬ノ( º _ ºノ)",
  "👏  /clap <text> — claps between words",
  "❓  /help — show this list"
];

const CELEBRATORY_EMOJIS = ["🎉", "🥳", "🎊", "🎂", "🎈", "🎆"];

export function containsCelebration(text) {
  const value = String(text || "");
  return CELEBRATORY_EMOJIS.some((emoji) => value.includes(emoji));
}

/**
 * Parse user input.
 *
 * Returns one of:
 *   { kind: "send", text }            — replace input with this text and send to room
 *   { kind: "local", text }           — show locally only (sender sees a system line)
 *   { kind: "passthrough" }           — not a command, send original input as-is
 */
export function parseSlashCommand(rawInput, { displayName } = {}) {
  const input = String(rawInput || "");
  if (!input.startsWith("/")) return { kind: "passthrough" };

  const body = input.slice(1);
  const spaceIdx = body.indexOf(" ");
  const head = (spaceIdx === -1 ? body : body.slice(0, spaceIdx)).toLowerCase();
  const rest = spaceIdx === -1 ? "" : body.slice(spaceIdx + 1).trim();

  switch (head) {
    case "roll":
      return { kind: "send", text: rollDice(rest || "1d6") };
    case "flip":
    case "coin":
      return { kind: "send", text: flipCoin() };
    case "8ball":
    case "8":
      return { kind: "send", text: eightBall(rest) };
    case "joke":
      return { kind: "send", text: `😄 ${pick(JOKES)}` };
    case "me": {
      const text = meAction(rest, displayName);
      if (!text) return { kind: "passthrough" };
      return { kind: "send", text };
    }
    case "shrug":
      return { kind: "send", text: `¯\\_(ツ)_/¯${rest ? ` ${rest}` : ""}` };
    case "tableflip":
      return { kind: "send", text: `(╯°□°)╯︵ ┻━┻${rest ? ` ${rest}` : ""}` };
    case "unflip":
      return { kind: "send", text: `┬─┬ノ( º _ ºノ)${rest ? ` ${rest}` : ""}` };
    case "clap": {
      const text = clapify(rest);
      if (!text) return { kind: "passthrough" };
      return { kind: "send", text };
    }
    case "help":
    case "commands":
      return { kind: "local", text: `Slash commands:\n${SLASH_HELP_LINES.join("\n")}` };
    default:
      return { kind: "passthrough" };
  }
}
