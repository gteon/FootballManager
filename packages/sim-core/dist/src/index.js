import { FootballEngine } from './engine';
import { Player, Ball } from './player';
import { XorShift32 } from './rng';
import { v2 } from './vector';
// Classes and values
export { FootballEngine, Player, Ball, XorShift32, v2 };
export function createEngine(config) {
    return new FootballEngine(config);
}
//# sourceMappingURL=index.js.map