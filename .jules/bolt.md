## 2024-05-14 - Physics collision loops should avoid array spreading
**Learning:** In hot loops like `shouldUseGJK` that runs every frame for collisions, array spreading `[...a, ...b]` allocates intermediate arrays causing GC pressure.
**Action:** Replace `for (const x of [...a, ...b])` with sequential loops or manual checks to prevent allocations in physics.
