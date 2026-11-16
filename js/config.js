// Nkemji's LifeBox: data model and categories.
// This file is the single source of truth. Change a category here and the whole app follows.

export const APP_NAME = "Nkemji's LifeBox";
export const APP_SHORT_NAME = "LifeBox";

// Every item has these fields.
// id, title, category, link, image, notes, tags, status, extra, createdAt, updatedAt
export const STATUSES = [
  { key: "want", label: "Want to try", emoji: "✨" },
  { key: "tried", label: "Tried it", emoji: "👀" },
  { key: "loved", label: "Loved it", emoji: "💛" },
];

// Groups give the home screen its tiles.
export const GROUPS = [
  { key: "play", label: "Play & Watch", color: "#ff9f6b" },
  { key: "eat", label: "Eat & Sip", color: "#f7c948" },
  { key: "go", label: "Go & Do", color: "#6bcf9f" },
  { key: "make", label: "Make & Learn", color: "#7aa7ff" },
  { key: "life", label: "Life & People", color: "#d58cff" },
  { key: "odds", label: "Odds & Ends", color: "#b8b8c8" },
];

// imageFirst: true means the gallery shows big photos (hairstyles, inspiration).
// extra: optional fields that appear only for that category.
export const CATEGORIES = [
  { key: "games", label: "Games", emoji: "🎮", group: "play",
    extra: [
      { key: "players", label: "Players", type: "text", placeholder: "e.g. 4+" },
      { key: "playOn", label: "Play on", type: "select", options: ["Phone", "Console", "PC", "In person", "Online"] },
    ] },
  { key: "movies", label: "Movies", emoji: "🎬", group: "play",
    extra: [{ key: "watchOn", label: "Where to watch", type: "text" }] },
  { key: "shows", label: "Shows & Series", emoji: "📺", group: "play",
    extra: [{ key: "watchOn", label: "Where to watch", type: "text" }] },
  { key: "music", label: "Music & Playlists", emoji: "🎧", group: "play" },
  { key: "podcasts", label: "Podcasts", emoji: "🎙️", group: "play" },
  { key: "books", label: "Books & Reads", emoji: "📚", group: "play" },

  { key: "recipes", label: "Recipes", emoji: "🍲", group: "eat" },
  { key: "restaurants", label: "Restaurants & Food Spots", emoji: "🍽️", group: "eat" },
  { key: "cafes", label: "Cafes & Drinks", emoji: "☕", group: "eat" },

  { key: "places", label: "Places to Visit", emoji: "📍", group: "go" },
  { key: "trips", label: "Trips & Travel Ideas", emoji: "✈️", group: "go" },
  { key: "events", label: "Events & Activities", emoji: "🎟️", group: "go" },
  { key: "outdoor", label: "Outdoor & Day-Out Ideas", emoji: "🥾", group: "go" },

  { key: "ideas", label: "Ideas", emoji: "💡", group: "make" },
  { key: "inspiration", label: "Inspiration", emoji: "🎨", group: "make", imageFirst: true },
  { key: "learn", label: "Things to Learn", emoji: "🧠", group: "make",
    extra: [
      { key: "format", label: "Format", type: "select", options: ["Course", "Video", "Article", "Book"] },
      { key: "finished", label: "Finished", type: "checkbox" },
    ] },
  { key: "tools", label: "Tools & Apps", emoji: "🛠️", group: "make" },
  { key: "templates", label: "Templates & Resources", emoji: "🧰", group: "make" },

  { key: "gifts", label: "Gift Ideas", emoji: "🎁", group: "life" },
  { key: "style", label: "Style & Fashion", emoji: "👗", group: "life", imageFirst: true },
  { key: "hairstyles", label: "Hairstyles", emoji: "💇🏾‍♀️", group: "life", imageFirst: true },
  { key: "skincare", label: "Skincare", emoji: "🧴", group: "life" },
  { key: "buy", label: "Things to Buy", emoji: "🛍️", group: "life" },
  { key: "friends", label: "Friend & Group Ideas", emoji: "👥", group: "life" },
  { key: "quotes", label: "Quotes & Words", emoji: "💬", group: "life" },

  { key: "random", label: "Random Finds", emoji: "🧺", group: "odds" },
];
