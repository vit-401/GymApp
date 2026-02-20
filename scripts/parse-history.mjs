/**
 * Parse workout text history into GymApp JSON backup format.
 * Run: node scripts/parse-history.mjs > history-backup.json
 */

let setCounter = 0;
const nextId = () => `hist-${++setCounter}`;

function makeSet(reps, weight, multiplier) {
  const s = { id: nextId(), reps };
  if (weight) s.weight = weight;
  if (multiplier && multiplier > 1) s.multiplier = multiplier;
  return s;
}

// Program slot mapping: day -> ordered exercise IDs
const DAY_EXERCISES = {
  1: ['seed-back-1', 'seed-back-2', 'seed-biceps-1', 'seed-rear-delts-1', 'seed-abs-1'],
  2: ['seed-chest-1', 'seed-shoulders-2', 'seed-chest-2', 'seed-shoulders-1', 'seed-triceps-1'],
  3: ['seed-legs-1', 'seed-hamstring-1', 'seed-legs-2', 'seed-calves-1'],
  5: ['seed-legs-3', 'seed-back-1', 'seed-back-3', 'seed-biceps-2', 'seed-traps-1', 'seed-abs-1'],
  6: ['seed-chest-1', 'seed-shoulders-3', 'seed-chest-3', 'seed-shoulders-1', 'seed-triceps-2'],
  7: ['seed-legs-1', 'seed-hamstring-2', 'seed-quads-1', 'seed-calves-1'],
};

const DAY_LABELS = { 1: 'PULL', 2: 'PUSH', 3: 'LEGS', 5: 'PULL', 6: 'PUSH', 7: 'LEGS' };

function session(date, dayNum, exerciseSets) {
  const exIds = DAY_EXERCISES[dayNum];
  const exercises = exerciseSets.map((sets, i) => ({
    slotId: `hist-d${dayNum}-s${i}`,
    exerciseId: exIds[i],
    sets,
  }));

  return {
    id: `hist-${date}-d${dayNum}`,
    date,
    dayNumber: dayNum,
    dayLabel: DAY_LABELS[dayNum],
    completed: true,
    completedAt: `${date}T20:00:00.000Z`,
    exercises,
  };
}

// s(reps) = bodyweight, s(reps, w) = single weight, s(reps, w, 2) = dumbbell pair
const s = (r, w, m) => makeSet(r, w || undefined, m || undefined);

const sessions = [
  // ── Feb 3 — D5 PULL ──
  session('2026-02-03', 5, [
    [s(12, 45, 2), s(10, 70, 2), s(10, 80, 2)],           // Legs 3
    [s(12), s(9), s(7)],                                     // Back (pull-ups)
    [s(12, 30, 2), s(10, 40, 2)],                            // Back 3
    [s(12, 25, 2), s(12, 30, 2), s(11, 40, 2)],             // Biceps 2
    [s(12, 45, 2), s(12, 45, 2), s(12, 50, 2)],             // Traps
    [s(11), s(11), s(8), s(7)],                              // ABS
  ]),

  // ── Feb 4 — D6 PUSH ──
  session('2026-02-04', 6, [
    [s(12, 60, 2), s(10, 70, 2), s(5, 75, 2), s(5, 85, 2)],    // Chest
    [s(15, 10, 2), s(15, 10, 2), s(15, 15, 2)],                  // Shoulders 3
    [s(20), s(15, 14), s(9, 14)],                                 // Chest 3 (bw + weight)
    [s(15, 20, 2), s(12, 20, 2), s(10, 20, 2)],                  // Shoulders
    [s(12, 20, 2), s(12, 20, 2), s(12, 25, 2)],                  // Triceps 2
  ]),

  // ── Feb 5 — D7 LEGS ──
  session('2026-02-05', 7, [
    [s(12, 45, 2), s(12, 55, 2), s(8, 70, 2)],              // Legs
    [s(15, 160), s(20, 180), s(14, 220)],                     // Hamstring 2 (machine)
    [s(12, 105), s(12, 105), s(12, 135), s(12, 135)],        // Quads (machine)
    [s(20, 45), s(16, 45), s(16, 45)],                        // Calves
  ]),

  // ── Feb 6 — D1 PULL ──
  session('2026-02-06', 1, [
    [s(12), s(9), s(6), s(6)],                                // Back (pull-ups)
    [s(15, 30, 2), s(12, 45, 2), s(10, 55, 2)],              // Back 2
    [s(12, 25, 2), s(12, 30, 2), s(12, 35, 2)],              // Biceps
    [s(15, 20, 2), s(12, 20, 2), s(13, 20, 2)],              // Rear Delts
    [s(20), s(12), s(8)],                                      // ABS
  ]),

  // ── Feb 7 — D2 PUSH ──
  session('2026-02-07', 2, [
    [s(12, 65, 2), s(10, 75, 2), s(8, 85, 2), s(5, 90, 2)],    // Chest
    [s(15, 25, 2), s(12, 25, 2), s(11, 25, 2), s(6, 30, 2)],   // Shoulders 2
    [s(21, 35, 2), s(12, 45, 2), s(11, 45, 2)],                  // Chest 2
    [s(11, 25, 2), s(10, 25, 2), s(8, 25, 2)],                   // Shoulders
    [s(12, 25, 2), s(12, 25, 2), s(12, 25, 2), s(9, 30, 2)],   // Triceps
  ]),

  // ── Feb 8 — D3 LEGS ──
  session('2026-02-08', 3, [
    [s(15, 45, 2), s(15, 50, 2), s(12, 55, 2), s(7, 70, 2)],   // Legs
    [s(12, 50, 2), s(12, 60, 2), s(11, 70, 2)],                  // Hamstring
    [s(12), s(12), s(12)],                                         // Legs 2 (bodyweight)
    [s(20, 50, 2), s(20, 50, 2), s(16, 50, 2), s(16, 50, 2)],  // Calves
  ]),

  // ── Feb 10 — D5 PULL ──
  session('2026-02-10', 5, [
    [s(12, 50, 2), s(8, 60, 2), s(7, 70, 2), s(5, 75, 2)],     // Legs 3
    [s(12), s(9), s(7)],                                           // Back (pull-ups)
    [s(10, 45, 2), s(12, 45, 2), s(10, 45, 2)],                  // Back 3
    [s(15, 25, 2), s(14, 30, 2), s(10, 35, 2)],                  // Biceps 2
    [s(10, 45, 2), s(12, 50, 2), s(9, 60, 2)],                   // Traps
    [s(12), s(10), s(7), s(7)],                                    // ABS
  ]),

  // ── Feb 11 — D6 PUSH ──
  session('2026-02-11', 6, [
    [s(12, 55, 2), s(6, 65, 2), s(8, 65, 2), s(6, 70, 2)],     // Chest
    [s(12, 70, 2), s(12, 80, 2), s(6, 100, 2), s(10, 80, 2)],  // Shoulders 3
    [s(23), s(18), s(12), s(10)],                                  // Chest 3 (bodyweight)
    [s(10, 30, 2), s(10, 25, 2), s(8, 25, 2)],                   // Shoulders
    [s(12, 25, 2), s(12, 25, 2), s(8, 27.5, 2)],                // Triceps 2
  ]),

  // ── Feb 12 — D7 LEGS ──
  session('2026-02-12', 7, [
    [s(12, 55, 2), s(13, 60, 2), s(10, 70, 2), s(6, 80, 2)],   // Legs
    [s(15, 165), s(13, 135), s(15, 150)],                         // Hamstring 2 (machine)
    [s(20, 180), s(16, 200), s(13, 220)],                         // Quads (machine)
    [s(20, 50), s(25, 50), s(20, 50), s(13, 50)],                // Calves
  ]),

  // ── Feb 13 — D1 PULL ──
  session('2026-02-13', 1, [
    [s(14), s(9), s(8), s(6)],                                    // Back (pull-ups)
    [s(15, 35), s(12, 55), s(12, 55, 2), s(8, 60, 2)],          // Back 2
    [s(16), s(12, 5, 2), s(8, 15, 2), s(6, 15, 2)],             // Biceps
    [s(15, 25, 2), s(9, 25, 2), s(9, 25, 2), s(9, 25, 2)],     // Rear Delts
    [s(12), s(8), s(4), s(5)],                                    // ABS
  ]),

  // ── Feb 14 — D2 PUSH ──
  session('2026-02-14', 2, [
    [s(6, 85, 2), s(12, 60, 2), s(12, 70, 2), s(6, 80, 2)],    // Chest
    [s(15, 30, 2), s(10, 35, 2), s(9, 40, 2), s(7, 45, 2)],    // Shoulders 2
    [s(12, 45, 2), s(12, 50, 2), s(10, 50, 2)],                  // Chest 2
    [s(12, 30, 2), s(9, 30, 2), s(8, 25, 2)],                    // Shoulders
    [s(12, 30, 2), s(12, 30, 2), s(9, 30, 2), s(8, 30, 2)],    // Triceps
  ]),

  // ── Feb 15 — D3 LEGS ──
  session('2026-02-15', 3, [
    [s(12, 70, 2), s(11, 75, 2), s(7, 85, 2), s(6, 95, 2)],    // Legs
    [s(12, 45, 2), s(12, 55, 2), s(12, 65, 2)],                  // Hamstring
    [s(10), s(10), s(10)],                                         // Legs 2 (bodyweight)
    [s(25, 50, 2), s(20, 50, 2), s(15, 50, 2), s(15, 50, 2)],  // Calves
  ]),

  // ── Feb 17 — D5 PULL ──
  session('2026-02-17', 5, [
    [s(10, 60, 2), s(10, 60, 2), s(10, 60, 2), s(7, 60, 2)],   // Legs 3
    [s(12), s(7), s(6), s(6)],                                     // Back (pull-ups)
    [s(12, 45, 2), s(12, 45, 2), s(12, 45, 2)],                  // Back 3
    [s(12, 35, 2), s(10, 35, 2), s(8, 40, 2)],                   // Biceps 2
    [s(20, 50, 2), s(20, 50, 2), s(25, 50, 2), s(20, 50, 2)],  // Traps
    [s(14), s(10), s(8), s(8)],                                    // ABS
  ]),

  // ── Feb 18 — D6 PUSH ──
  session('2026-02-18', 6, [
    [s(12, 70, 2), s(12, 70, 2), s(10, 80, 2), s(7, 80, 2), s(4, 95, 2)],  // Chest
    [s(15, 10, 2), s(12, 15, 2), s(10, 25, 2)],                              // Shoulders 3
    [s(25), s(20), s(10, 15, 2), s(10, 15, 2)],                              // Chest 3
    [s(9, 30, 2), s(9, 25, 2), s(9, 25, 2), s(8, 25, 2)],                  // Shoulders
    [s(16, 25, 2), s(12, 25, 2), s(9, 25, 2)],                              // Triceps 2
  ]),
];

// Output only gymapp-workouts key
const backup = {
  'gymapp-workouts': {
    state: {
      sessions,
      currentDayNumber: 7,
    },
    version: 0,
  },
};

console.log(JSON.stringify(backup, null, 2));
