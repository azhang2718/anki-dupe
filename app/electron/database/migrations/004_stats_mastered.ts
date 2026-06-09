export const up = `
ALTER TABLE statistics ADD COLUMN mastered_reviewed INTEGER NOT NULL DEFAULT 0;
`

export const version = 4
