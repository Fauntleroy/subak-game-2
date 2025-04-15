export var GAME_WIDTH = 0.6; // meters
export var GAME_HEIGHT = 0.9; // meters
export var GAME_WIDTH_PX = 600;
export var GAME_HEIGHT_PX = 900;
export var WALL_THICKNESS = GAME_WIDTH / 20;
export var MERGE_THRESHOLD = 100; // ms to detect if fruits are touching
export var GAME_OVER_HEIGHT = GAME_HEIGHT / 6; // Y position above which game ends
export var FRUIT_NAMES = [
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
export var FRUITS = [];
var currentSize = 3.75;
for (var i = 0; i < FRUIT_NAMES.length; i++) {
    var currentRadius = GAME_WIDTH * (currentSize / 100);
    var fruitName = FRUIT_NAMES[i];
    FRUITS.push({
        name: fruitName,
        color: '#000000',
        size: currentSize,
        radius: currentRadius,
        points: (i + 1) * 2
    });
    currentSize = currentSize * 1.25;
}
