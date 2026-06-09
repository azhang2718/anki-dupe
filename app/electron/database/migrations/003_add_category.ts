export const up = `
ALTER TABLE words ADD COLUMN category TEXT NOT NULL DEFAULT 'Other';
`

export const version = 3
