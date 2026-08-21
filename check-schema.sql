SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      (table_name = 'Participant' AND column_name = 'accessCode')
      OR
      (table_name = 'TestResult' AND column_name = 'sessionId')
  )
ORDER BY table_name, column_name;
