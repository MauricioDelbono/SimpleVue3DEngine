## 2024-05-14 - Physics collision loops should avoid array spreading
**Learning:** In hot loops like `shouldUseGJK` that runs every frame for collisions, array spreading `[...a, ...b]` allocates intermediate arrays causing GC pressure.
**Action:** Replace `for (const x of [...a, ...b])` with sequential loops or manual checks to prevent allocations in physics.

## 2024-05-15 - Array slicing and closures in physics update loops
**Learning:** In high-frequency physics loops (`step`, `broadPhaseCollisions`, `narrowPhaseCollisions`), using `Array.forEach` creates a closure per iteration, and `objects.slice().reverse()` allocates a new array every frame. This causes severe garbage collection (GC) pressure and performance stutters.
**Action:** Always use standard index-based `for` loops (e.g., `for (let i = 0; i < len; i++)` or `for (let i = len - 1; i >= 0; i--)`) in physics/rendering update functions.
