export const up = `
INSERT OR IGNORE INTO achievements (key, name, description, icon, xp_reward) VALUES
  ('first_word',    'First Word',        'Learn your very first word.',         '🌱', 10),
  ('words_10',      '10 Words',          'Learn 10 words.',                     '📖', 25),
  ('words_100',     '100 Words',         'Learn 100 words.',                    '📚', 100),
  ('words_500',     '500 Words',         'Learn 500 words.',                    '🧠', 250),
  ('words_1000',    '1000 Words',        'Learn 1000 words.',                   '🎓', 500),
  ('mastered_50',   'Master 50 Words',   'Reach mastered state on 50 cards.',   '⭐', 150),
  ('mastered_500',  'Master 500 Words',  'Reach mastered state on 500 cards.',  '🌟', 500),
  ('streak_7',      '7-Day Streak',      'Study 7 days in a row.',              '🔥', 70),
  ('streak_30',     '30-Day Streak',     'Study 30 days in a row.',             '🔥', 300),
  ('streak_100',    '100-Day Streak',    'Study 100 days in a row.',            '💎', 1000),
  ('first_import',  'First Import',      'Import your first screenshot.',       '📸', 20),
  ('perfect_session','Perfect Session',  'Complete a session with no mistakes.','✨', 100);
`

export const version = 2
