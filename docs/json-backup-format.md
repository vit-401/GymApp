# GymApp JSON Backup Format

Use this format to create a JSON file for import via **Settings > Import JSON**.

## Top-Level Structure

```json
{
  "gymapp-workouts": { ... },
  "gymapp-exercises": { ... },
  "gymapp-program": { ... },
  "gymapp-metrics": { ... },
  "gymapp-timer": { ... }
}
```

All keys are optional — only include the ones you want to restore.

---

## gymapp-workouts

Workout sessions log.

```json
{
  "state": {
    "sessions": [
      {
        "id": "unique-id",
        "date": "2026-02-19",
        "dayNumber": 1,
        "dayLabel": "PULL",
        "completed": true,
        "completedAt": "2026-02-19T18:30:00.000Z",
        "exercises": [
          {
            "slotId": "slot-id",
            "exerciseId": "exercise-id",
            "sets": [
              {
                "id": "set-id",
                "reps": 12,
                "weight": 65,
                "multiplier": 2
              }
            ]
          }
        ]
      }
    ],
    "currentDayNumber": 1
  },
  "version": 0
}
```

### WorkoutSet fields

| Field        | Type     | Required | Description                              |
|-------------|----------|----------|------------------------------------------|
| `id`        | string   | yes      | Unique ID for the set                    |
| `reps`      | number   | yes      | Number of repetitions                    |
| `weight`    | number   | no       | Weight in lbs (omit for bodyweight)      |
| `multiplier`| number   | no       | Number of dumbbells (e.g. `2` = pair)    |

---

## gymapp-exercises

Exercise library.

```json
{
  "state": {
    "exercises": [
      {
        "id": "my-exercise-1",
        "name": "Barbell Row",
        "muscleGroup": "back",
        "weightType": "barbell",
        "imageUrl": ""
      }
    ]
  },
  "version": 0
}
```

### Exercise fields

| Field         | Type   | Required | Description                          |
|--------------|--------|----------|--------------------------------------|
| `id`         | string | yes      | Unique ID (referenced by program)    |
| `name`       | string | yes      | Display name                         |
| `muscleGroup`| string | yes      | One of the muscle groups below       |
| `weightType` | string | yes      | One of the weight types below        |
| `imageUrl`   | string | yes      | Base64 data URL or empty string `""` |

### Muscle groups

`back`, `biceps`, `rear_delts`, `abs`, `chest`, `shoulders`, `triceps`, `legs`, `hamstring`, `calves`, `quads`, `traps`

### Weight types

`dumbbell`, `barbell`, `bodyweight`, `bodyweight_weighted`, `machine`

---

## gymapp-program

7-day training split.

```json
{
  "state": {
    "days": [
      {
        "dayNumber": 1,
        "label": "PULL",
        "slots": [
          {
            "id": "slot-unique-id",
            "muscleGroup": "back",
            "exerciseId": "my-exercise-1"
          }
        ]
      },
      {
        "dayNumber": 4,
        "label": "REST",
        "slots": []
      }
    ]
  },
  "version": 0
}
```

- `dayNumber`: 1-7
- `label`: day name (e.g. `"PULL"`, `"PUSH"`, `"LEGS"`, `"REST"`)
- `slots[].exerciseId`: must match an `id` from `gymapp-exercises`, or `null` for unassigned

---

## gymapp-metrics

Body measurements.

```json
{
  "state": {
    "metrics": [
      {
        "id": "metric-id",
        "recordedAt": "2026-02-19T08:00:00.000Z",
        "weight": 180,
        "bellySize": 34
      }
    ]
  },
  "version": 0
}
```

| Field        | Type   | Required | Description                     |
|-------------|--------|----------|---------------------------------|
| `id`        | string | yes      | Unique ID                       |
| `recordedAt`| string | yes      | ISO 8601 datetime               |
| `weight`    | number | no       | Body weight in lbs              |
| `bellySize` | number | no       | Belly circumference in inches   |

---

## gymapp-timer

Rest timer settings. Only `defaultDuration` is persisted.

```json
{
  "state": {
    "defaultDuration": 120
  },
  "version": 0
}
```

---

## Minimal Example

A minimal backup with one exercise and one workout:

```json
{
  "gymapp-exercises": {
    "state": {
      "exercises": [
        {
          "id": "ex-1",
          "name": "Pull-ups",
          "muscleGroup": "back",
          "weightType": "bodyweight",
          "imageUrl": ""
        }
      ]
    },
    "version": 0
  },
  "gymapp-workouts": {
    "state": {
      "sessions": [
        {
          "id": "s1",
          "date": "2026-02-19",
          "dayNumber": 1,
          "dayLabel": "PULL",
          "completed": true,
          "exercises": [
            {
              "slotId": "slot-1",
              "exerciseId": "ex-1",
              "sets": [
                { "id": "set-1", "reps": 10 },
                { "id": "set-2", "reps": 8 }
              ]
            }
          ]
        }
      ],
      "currentDayNumber": 1
    },
    "version": 0
  }
}
```

---

## Tips

- Use **Export JSON** first to see your current data structure as a reference.
- IDs can be any unique string (UUID, `"ex-1"`, etc.).
- The `"version": 0` field is required by Zustand's persist middleware.
- Each store value is wrapped in `{ "state": { ... }, "version": 0 }`.






Vitalii Prysiazhniuk, [Feb 3, 2026 at 8:36 PM]
D5


12- 2*45 legs

10- 2*70

10- 2*80

Back

12

9

7.5


Back2

2*30


2*40

Biceps 💪 

12-2*25
12-2*30
11-2*40

Traps

12-2*45
12-2*45
12-2*50

ABS

11
11
8
7

Vitalii Prysiazhniuk, [Feb 4, 2026 at 5:41 PM]
D6

Chest
12-2*60
10-2*70
5-2*75
5-2*85

Shoulders
15-2*10
15-2*10
15-2*15

Chest
20
15- 14+
9- 14+

Shoulders
15 - 2*20
12- 2*20
10-2*20


Triceps

12 - 2*20
12 - 2*20
12 - 2*25

Vitalii Prysiazhniuk, [Feb 5, 2026 at 6:18 PM]
D7

Legs
12-2*45
12-2*55
8-2*70


Hamstring 

15-160
20-180
14-220


Quads

12-105
12-105
12-135
12-135


Calves

20-45
16-45
16-45

Vitalii Prysiazhniuk, [Feb 6, 2026 at 6:21 PM]
D1

Back (pull bar)
12
9
6
6



Back
15-2*30
12-2*45
10-2*55







Biceps 

12-2*25
12-2*30
12-2*35


Rear deltas 
15-2*20
12-2*20
13-2*20


ABS
20
12
8

Vitalii Prysiazhniuk, [Feb 7, 2026 at 8:17 PM]
D2

Chest
12-2*65
10-2*75
8-2*85
5-2*90



Shoulders 
15 - 2*25
12- 2*25
11-2*25 
6-2*30





Chest
21-2*35
12-2*45
11-2*45





Shoulders 
11-2*25
11-2*25
10-2*25
8-2*25


Triceps
12-2*25
12-2*25
12-2*25
9-2*30

Vitalii Prysiazhniuk, [Feb 8, 2026 at 3:34 PM]
D3 LEGS

Legs
15 - 2*45
15 - 2*50
12 - 2*55
7 - 2*70

Hamstring
12 - 2*50
12 - 2*60
11 - 2*70

Legs
12
12
12

Calves
20 - 2*50
20 - 2*50
16 - 2*50
16 - 2*50

Vitalii Prysiazhniuk, [Feb 10, 2026 at 7:01 PM]
D5 PULL

Legs
12 - 2*50
8 - 2*60
7 - 2*70
5 - 2*75

Back
12
9
7

Back
10 - 2*45
12 - 2*45
10 - 2*45

Biceps
15 - 2*25
14 - 2*30
10 - 2*35

Traps
10 - 2*45
12 - 2*50
9 - 2*60

ABS
12
10
7
7

Vitalii Prysiazhniuk, [Feb 11, 2026 at 4:24 PM]
D6 PUSH

Chest
12 - 2*55
6 - 2*65
8 - 2*65
6 - 2*70

Shoulders
12 - 2*70
12 - 2*80
6 - 2*100
10 - 2*80

Chest
23
18
12
10

Shoulders
10 - 2*30
10 - 2*25
8 - 2*25

Triceps
12 - 2*25
12 - 2*25
8 - 2*27.5

Vitalii Prysiazhniuk, [Feb 12, 2026 at 10:30 PM]
D7 LEGS

Legs
12 - 2*55
13 - 2*60
10 - 2*70
6 - 2*80

Hamstring 2
15 - 165
13 - 135
15 - 150

Quads
20 - 180
16 - 200
13 - 220

Calves
20 - 50
25 - 50
20 - 50
13 - 50

Vitalii Prysiazhniuk, [Feb 13, 2026 at 7:47 PM]
D1 PULL

Back
14
9
8
6

Back 2
15 - 35
12 - 55
12 - 2*55
8 - 2*60

Biceps
16
12 - 2*5
8 - 2*15
6 - 2*15

Rear Delts
15 - 2*25
9 - 2*25
9 - 2*25
9 - 2*25

ABS
12
8
4
5

Vitalii Prysiazhniuk, [Feb 14, 2026 at 2:34 PM]
D2 PUSH

Chest
6 - 2*85
12 - 2*60
12 - 2*70
6 - 2*80

Shoulders 2
15 - 2*30
10 - 2*35
9 - 2*40
7 - 2*45

Chest 2
12 - 2*45
12 - 2*50
10 - 2*50

Shoulders
12 - 2*30
9 - 2*30
8 - 2*25

Triceps
12 - 2*30
12 - 2*30
9 - 2*30
8 - 2*30

Vitalii Prysiazhniuk, [Feb 15, 2026 at 4:39 PM]
D3 LEGS

Legs
12 - 2*70
11 - 2*75
7 - 2*85
6 - 2*95

Hamstring
12 - 2*45
12 - 2*55
12 - 2*65

Legs 2
10
10
10

Calves
25 - 2*50
20 - 2*50
15 - 2*50
15 - 2*50

Vitalii Prysiazhniuk, [Feb 17, 2026 at 8:19 PM]
D5 PULL

Legs 3
10 - 2*60
10 - 2*60
10 - 2*60
7 - 2*60

Back
12
7
6
6

Back 3
12 - 2*45
12 - 2*45
12 - 2*45

Biceps 2
12 - 2*35
10 - 2*35
8 - 2*40

Traps
20 - 2*50
20 - 2*50
25 - 2*50
20 - 2*50

ABS
14
10
8
8

Vitalii Prysiazhniuk, [Feb 18, 2026 at 11:31 AM]
D6 PUSH

Chest
12 - 2*70
12 - 2*70
10 - 2*80
7 - 2*80
4 - 2*95

Shoulders 3
15 - 2*10
12 - 2*15
10 - 2*25

Chest 3
25
20
10 - 2*15
10 - 2*15

Shoulders
9 - 2*30
9 - 2*25
9 - 2*25
8 - 2*25

Triceps 2
16 - 2*25
12 - 2*25
9 - 2*25
