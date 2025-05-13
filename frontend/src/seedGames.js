// seedGames.js
import { db } from "./firebase";
import { collection, setDoc, doc } from "firebase/firestore";

const games = [
  {
    id: "celeste",
    title: "Celeste",
    developer: "Maddy Makes Games",
    developerId: "dev_celeste",
    price: 19.99,
    genre: "Platformer",
    description: "Help Madeline survive her climb to the top of Celeste Mountain in this pixel-perfect, emotional platformer.",
    imageUrl: "/celeste.png",
    isMystery: true,
    screenshots: ["/celeste1.png", "/celeste2.png"]
  },
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    developer: "Team Cherry",
    developerId: "dev_hollow",
    price: 15.99,
    genre: "Metroidvania",
    description: "Forge your path through a haunting world in this stunning Metroidvania with tight combat and deep secrets.",
    imageUrl: "/hollowknight.png",
    isMystery: true,
    screenshots: ["/hollow1.png", "/hollow2.png"]
  },
  {
    id: "night-in-the-woods",
    title: "Night in the Woods",
    developer: "Infinite Fall",
    developerId: "dev_night",
    price: 12.99,
    genre: "Narrative Adventure",
    description: "A heartfelt story game about friendship, mental health, and reconnecting with your hometown.",
    imageUrl: "/knightinthewoods.png",
    isMystery: true,
    screenshots: ["/night1.png", "/night2.png"]
  },
  {
    id: "dragon-quest-xi",
    title: "Dragon Quest XI",
    developer: "Square Enix",
    developerId: "dev_dqxi",
    price: 39.99,
    genre: "JRPG",
    description: "Join the Luminary and his companions on an epic turn-based journey to save Erdrea in this modern JRPG classic.",
    imageUrl: "/dragonquest.png",
    isMystery: true,
    screenshots: ["/dq1.png", "/dq2.png"]
  }
];

export const seedGames = async () => {
  const gamesRef = collection(db, "games");

  for (const game of games) {
    try {
      await setDoc(doc(gamesRef, game.id), game);
      console.log(`✅ Seeded game: ${game.title}`);
    } catch (err) {
      console.error(`❌ Failed to add game: ${game.title}`, err);
    }
  }
};
