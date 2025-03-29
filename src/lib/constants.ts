export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 900;
export const WALL_THICKNESS = 10;
export const MERGE_THRESHOLD = 100; // ms to detect if fruits are touching
export const GAME_OVER_HEIGHT = -50; // Y position above which game ends

export const FRUIT_NAMES: string[] = [
  'blueberry',
  'grape',
  'lemon',
  'orange',
  'apple',
  'dragonfruit',
  'pear',
  'peach',
  'pineapple',
  'honeydew',
  'watermelon'
];

export interface FruitData {
  name: string;
  color: string;
  size: number;
  radius: number;
  points: number;
}

export const FRUITS: FruitData[] = [];

let currentSize = 3.75;

for (let i = 0; i < FRUIT_NAMES.length; i++) {
  const currentRadius = GAME_WIDTH * (currentSize / 100);
  const fruitName = FRUIT_NAMES[i];
  FRUITS.push({
    name: fruitName,
    color: '#000000',
    size: currentSize,
    radius: currentRadius,
    points: (i + 1) * 2
  });

  currentSize = currentSize * 1.25;
}
