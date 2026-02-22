# CSV Course Import Format

## Required columns

| Column        | Type   | Description                          |
| ------------- | ------ | ------------------------------------ |
| `holeNumber`  | number | Hole number (1–18)                   |
| `par`         | number | Par for the hole (3, 4, or 5)        |
| `strokeIndex` | number | Stroke index / handicap index (1–18) |

## Optional columns

| Column       | Type   | Description                             |
| ------------ | ------ | --------------------------------------- |
| `courseName` | string | Course name (used if provided on row 1) |

## Rules

- The file must be a `.csv` with comma-separated values
- Headers are required on the first row
- Header names are case-insensitive (`HoleNumber` = `holenumber` = `HOLENUMBER`)
- 9 or 18 holes are supported
- Hole numbers must be sequential (1–9 or 1–18)
- Par must be 3, 4, or 5
- Stroke index must be unique and in range 1–9 (for 9 holes) or 1–18 (for 18 holes)
- Empty rows are skipped
- Trailing whitespace is trimmed

## Example (18 holes)

```csv
holeNumber,par,strokeIndex
1,4,11
2,5,3
3,3,17
4,4,7
5,4,1
6,4,13
7,3,15
8,5,5
9,4,9
10,4,12
11,5,4
12,3,18
13,4,8
14,4,2
15,4,14
16,3,16
17,5,6
18,4,10
```

## Example (with course name)

```csv
courseName,holeNumber,par,strokeIndex
Los Naranjos Golf Club,1,4,11
Los Naranjos Golf Club,2,5,3
...
```

## Sample files

See the `docs/csv-examples/` folder for ready-to-import files:

- `los-naranjos.csv` — Los Naranjos Golf Club, Marbella (18 holes)
- `valderrama.csv` — Real Club Valderrama, Sotogrande (18 holes)
- `rio-real.csv` — Rio Real Golf, Marbella (18 holes)
