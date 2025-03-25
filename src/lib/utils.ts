import { GAME_HEIGHT, GAME_WIDTH, FRUITS } from "./constants";

/**
 * Checks if a point is within the game boundaries
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean}
 */
export const isWithinBounds = (x, y) => {
  return x >= 0 && x <= GAME_WIDTH && y >= 0 && y <= GAME_HEIGHT;
};

/**
 * Calculates the distance between two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {number}
 */
export const getDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Checks if two circles are overlapping
 * @param {number} x1 - First circle X coordinate
 * @param {number} y1 - First circle Y coordinate
 * @param {number} r1 - First circle radius
 * @param {number} x2 - Second circle X coordinate
 * @param {number} y2 - Second circle Y coordinate
 * @param {number} r2 - Second circle radius
 * @returns {boolean}
 */
export const areCirclesOverlapping = (x1, y1, r1, x2, y2, r2) => {
  const distance = getDistance(x1, y1, x2, y2);
  return distance < r1 + r2;
};

/**
 * Calculates the midpoint between two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {{x: number, y: number}}
 */
export const getMidpoint = (x1, y1, x2, y2) => {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };
};

/**
 * Formats a score number with comma separators
 * @param {number} score
 * @returns {string}
 */
export const formatScore = (score) => {
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Gets the next fruit tier based on current fruit index
 * @param {number} currentIndex
 * @returns {number}
 */
export const getNextFruitTier = (currentIndex) => {
  return currentIndex + 1 >= FRUITS.length ? currentIndex : currentIndex + 1;
};

/**
 * Formats a date for the scoreboard
 * @param {Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calculates points based on merged fruit sizes
 * @param {number} fruitIndex
 * @returns {number}
 */
export const calculateMergePoints = (fruitIndex) => {
  const basePoints = FRUITS[fruitIndex].points;
  const multiplier = Math.floor(fruitIndex / 2) + 1;
  return basePoints * multiplier;
};

/**
 * Generates a random fruit index for the first few tiers
 * @returns {number}
 */
export const getRandomInitialFruit = () => {
  return Math.floor(Math.random() * 3); // Only first 3 fruit types for initial drops
};

/**
 * Checks if a position would result in a valid fruit placement
 * @param {number} x
 * @param {number} radius
 * @returns {boolean}
 */
export const isValidDropPosition = (x, radius) => {
  return x >= radius && x <= GAME_WIDTH - radius;
};

/**
 * Clamps a value between a minimum and maximum
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Converts radians to degrees
 * @param {number} radians
 * @returns {number}
 */
export const radiansToDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Linear interpolation between two values
 * @param {number} start
 * @param {number} end
 * @param {number} t
 * @returns {number}
 */
export const lerp = (start, end, t) => {
  return start * (1 - t) + end * t;
};
