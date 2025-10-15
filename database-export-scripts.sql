-- ============================================
-- LOVABLE CLOUD TO SUPABASE MIGRATION SCRIPT
-- ============================================
-- Run these commands in your Lovable Cloud backend SQL editor
-- Copy the results and import them into your new Supabase project

-- ============================================
-- STEP 1: EXPORT DATA AS CSV
-- ============================================
-- Run each command separately and save the output as CSV files

-- Export profiles
COPY (SELECT * FROM profiles ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save as: profiles.csv

-- Export notes
COPY (SELECT * FROM notes ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save as: notes.csv

-- Export quizzes
COPY (SELECT * FROM quizzes ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save as: quizzes.csv

-- Export past_papers
COPY (SELECT * FROM past_papers ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save as: past_papers.csv

-- Export study_plans
COPY (SELECT * FROM study_plans ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save as: study_plans.csv

-- Export study_tasks
COPY (SELECT * FROM study_tasks ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save as: study_tasks.csv

-- Export chat_sessions
COPY (SELECT * FROM chat_sessions ORDER BY created_at) TO STDOUT WITH CSV HEADER;
-- Save as: chat_sessions.csv

-- ============================================
-- STEP 2: SCHEMA EXPORT (FOR REFERENCE)
-- ============================================
-- Your complete schema is in supabase/migrations/ folder
-- Copy all files from that folder to your new Supabase project

-- ============================================
-- STEP 3: IMPORT INTO NEW SUPABASE PROJECT
-- ============================================
-- After creating your new Supabase project:

-- 1. Run all migration files from supabase/migrations/ in order
-- 2. Import CSV files using:

-- COPY profiles FROM '/path/to/profiles.csv' WITH CSV HEADER;
-- COPY notes FROM '/path/to/notes.csv' WITH CSV HEADER;
-- COPY quizzes FROM '/path/to/quizzes.csv' WITH CSV HEADER;
-- COPY past_papers FROM '/path/to/past_papers.csv' WITH CSV HEADER;
-- COPY study_plans FROM '/path/to/study_plans.csv' WITH CSV HEADER;
-- COPY study_tasks FROM '/path/to/study_tasks.csv' WITH CSV HEADER;
-- COPY chat_sessions FROM '/path/to/chat_sessions.csv' WITH CSV HEADER;

-- ============================================
-- STEP 4: VERIFY DATA
-- ============================================
-- Run these queries in your new Supabase project to verify:

SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'quizzes', COUNT(*) FROM quizzes
UNION ALL
SELECT 'past_papers', COUNT(*) FROM past_papers
UNION ALL
SELECT 'study_plans', COUNT(*) FROM study_plans
UNION ALL
SELECT 'study_tasks', COUNT(*) FROM study_tasks
UNION ALL
SELECT 'chat_sessions', COUNT(*) FROM chat_sessions;

-- ============================================
-- NOTES:
-- ============================================
-- - Storage bucket 'study-files' will need to be recreated manually
-- - Edge functions in supabase/functions/ need to be deployed to new project
-- - Update .env file with new Supabase credentials after migration
-- - Secrets (API keys) need to be reconfigured in new project
