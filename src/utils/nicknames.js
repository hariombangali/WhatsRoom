const ADJECTIVES = [
  "Cosmic", "Sparkly", "Dancing", "Sleepy", "Mighty", "Curious", "Hidden",
  "Lucky", "Wandering", "Electric", "Frosty", "Jolly", "Mystic", "Neon",
  "Silent", "Sunny", "Velvet", "Wild", "Zesty", "Quantum", "Pixel",
  "Turbo", "Cyber", "Lunar", "Solar", "Stellar", "Galactic", "Witty",
  "Daring", "Fearless", "Groovy", "Plucky", "Radiant", "Snappy", "Spiffy"
];

const NOUNS = [
  "Otter", "Ninja", "Phoenix", "Wizard", "Tiger", "Falcon", "Panda",
  "Comet", "Voyager", "Captain", "Wanderer", "Dreamer", "Ranger", "Pilot",
  "Sprite", "Sage", "Knight", "Maverick", "Nomad", "Rebel", "Hawk",
  "Yeti", "Llama", "Penguin", "Cosmonaut", "Bard", "Jester", "Goblin",
  "Dragon", "Kraken", "Mage", "Rogue", "Scout", "Specter", "Wraith"
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function generateNickname() {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}
