export const FRUITS = [
  { name: "Cherry", radius: 15, color: "#FF0000", points: 10 },
  { name: "Strawberry", radius: 20, color: "#FF3366", points: 20 },
  { name: "Grape", radius: 25, color: "#9932CC", points: 30 },
  { name: "Orange", radius: 30, color: "#FFA500", points: 40 },
  { name: "Apple", radius: 35, color: "#FF6347", points: 50 },
  { name: "Pear", radius: 40, color: "#98FB98", points: 60 },
  { name: "Peach", radius: 45, color: "#FFA07A", points: 70 },
  { name: "Pineapple", radius: 50, color: "#FFD700", points: 80 },
  { name: "Melon", radius: 55, color: "#90EE90", points: 90 },
  { name: "Watermelon", radius: 60, color: "#FF6B6B", points: 100 },
];

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const WALL_THICKNESS = 10;
export const MERGE_THRESHOLD = 100; // ms to detect if fruits are touching
export const GAME_OVER_HEIGHT = -50; // Y position above which game ends
