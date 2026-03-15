/**
 * Simple script to verify XP and Leveling logic.
 */
const testXP = (xp, currentLevel) => {
    let level = currentLevel;
    let nextLevelXP = level * 100 + (level - 1) * 50;
    while (xp >= nextLevelXP) {
        level++;
        nextLevelXP = level * 100 + (level - 1) * 50;
    }
    return level;
};

console.log("Level for 100 XP (expected 2):", testXP(100, 1));
console.log("Level for 250 XP (expected 3):", testXP(250, 1));
console.log("Level for 450 XP (expected 4):", testXP(450, 1));
