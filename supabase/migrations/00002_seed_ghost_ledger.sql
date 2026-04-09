-- Seed data: The Heist campaign + Ghost Ledger mission

-- Campaign: The Heist
INSERT INTO campaigns (id, slug, title, description, narrative_intro, difficulty, mission_count, is_free, sort_order)
VALUES (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'the-heist',
    'The Heist',
    'A three-mission campaign investigating corporate fraud, AI sabotage, and identity theft using real code in sandboxed environments.',
    'Welcome to the program, operative. You''ve been selected for your technical skills and your discretion. The missions ahead will test your abilities with databases, command lines, and machine learning pipelines. Each assignment is real — real data, real systems, real consequences. Your handler will guide you, but the work is yours alone.',
    'beginner',
    3,
    true,
    1
);

-- Mission 1: The Ghost Ledger
INSERT INTO missions (id, campaign_id, slug, title, codename, description, narrative_briefing, difficulty, sort_order, stage_count, skills, docker_image, time_limit_minutes, par_time_minutes)
VALUES (
    'b2c3d4e5-0001-4000-8000-000000000001',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'ghost-ledger',
    'The Ghost Ledger',
    'The Ghost Ledger',
    'A fintech startup''s books don''t balance. $2.3M missing. Trace it.',
    'NovaPay Technologies processes $400M annually. Their Q4 reconciliation flagged a $2.3 million discrepancy spread across thousands of transactions. Someone with deep system access built this fraud to stay hidden. You have 2 hours to find the money, trace the pattern, and build the case.',
    'beginner',
    1,
    3,
    ARRAY['bash', 'sql', 'python'],
    'heist-mission-ghost-ledger:latest',
    120,
    60
);

-- Stage 1: Recon the Environment (Bash)
INSERT INTO stages (id, mission_id, sort_order, title, briefing, skill_primary, skills_secondary, objectives, hints, intel_drops, par_time_minutes, par_lines)
VALUES (
    'c3d4e5f6-0001-4000-8000-000000000001',
    'b2c3d4e5-0001-4000-8000-000000000001',
    1,
    'Recon the Environment',
    'Explore NovaPay''s server filesystem. Examine logs, config files, and scripts to identify how the fraud was automated.',
    'bash',
    NULL,
    '[
        {
            "id": "find_ghost_user",
            "title": "Identify Ghost Account",
            "description": "Identify the ghost service account username",
            "validator": {"type": "answer_match", "expected": "ghost_svc", "case_sensitive": true},
            "is_bonus": false,
            "points": 15
        },
        {
            "id": "find_cron_script",
            "title": "Find Cron Script",
            "description": "Find the script that runs the fraudulent process",
            "validator": {"type": "answer_match", "expected": "reconcile.sh", "case_sensitive": false},
            "is_bonus": false,
            "points": 10
        },
        {
            "id": "find_hidden_script",
            "title": "Find Hidden Script",
            "description": "Find the hidden Python script that creates fraudulent transactions",
            "validator": {"type": "file_exists", "path": "/novapay/scripts/.recon_adjust.py"},
            "is_bonus": false,
            "points": 15
        },
        {
            "id": "find_hidden_logs",
            "title": "Find Hidden Logs",
            "description": "Locate the hidden adjustment logs",
            "validator": {"type": "command_output_match", "command": ["ls", "-la", "/novapay/logs/"], "expected_pattern": "\\.adjust_"},
            "is_bonus": false,
            "points": 10
        }
    ]'::jsonb,
    '[
        {"text": "Check the hidden .env.local file in the app config directory for a separate database user.", "unlock_after_minutes": 5},
        {"text": "Look at the crontab file in /novapay/scripts/ — which script runs at 02:00?", "unlock_after_minutes": 5},
        {"text": "The reconcile.sh script calls a hidden file. Check for dotfiles in the scripts directory with ls -la.", "unlock_after_minutes": 8},
        {"text": "Run ls -la in /novapay/logs/ — look for hidden files starting with a dot.", "unlock_after_minutes": 5}
    ]'::jsonb,
    '[
        {"filename": "stage_1_complete.md", "content": "", "path": "intel/stage_1_complete.md"}
    ]'::jsonb,
    20,
    15
);

-- Stage 2: Follow the Money (SQL)
INSERT INTO stages (id, mission_id, sort_order, title, briefing, skill_primary, skills_secondary, objectives, hints, intel_drops, par_time_minutes, par_lines)
VALUES (
    'c3d4e5f6-0002-4000-8000-000000000001',
    'b2c3d4e5-0001-4000-8000-000000000001',
    2,
    'Follow the Money',
    'Connect to the NovaPay database and trace the fraudulent transactions. Find the pattern, identify the destination, and calculate the total.',
    'sql',
    NULL,
    '[
        {
            "id": "count_suspicious_txns",
            "title": "Count Suspicious Transactions",
            "description": "Find the total number of transactions created by the ghost service account",
            "validator": {"type": "query_result_match", "query": "SELECT COUNT(*) FROM novapay.transactions WHERE created_by = (SELECT user_id FROM novapay.users WHERE username = ''ghost_svc'');", "expected_value": "2541", "database": "novapay"},
            "is_bonus": false,
            "points": 20
        },
        {
            "id": "find_skim_total",
            "title": "Calculate Total Diverted",
            "description": "Calculate the total amount diverted to Meridian Dynamics accounts",
            "validator": {"type": "answer_match", "expected": "2314887.43", "case_sensitive": false},
            "is_bonus": false,
            "points": 25
        },
        {
            "id": "find_meridian_accounts",
            "title": "Count Shell Accounts",
            "description": "Identify how many Meridian Dynamics shell company accounts received funds",
            "validator": {"type": "answer_match", "expected": "3", "case_sensitive": false},
            "is_bonus": false,
            "points": 15
        },
        {
            "id": "find_audit_gaps",
            "title": "Detect Audit Log Gaps",
            "description": "Determine the approximate percentage of ghost_svc transactions that have audit log entries",
            "validator": {"type": "answer_match", "expected": "5", "tolerance_type": "range", "tolerance_range": [3, 7]},
            "is_bonus": false,
            "points": 20
        }
    ]'::jsonb,
    '[
        {"text": "Query the transactions table and JOIN with users to filter by the ghost_svc username. Count all matching rows.", "unlock_after_minutes": 5},
        {"text": "Filter transactions where: created_by is ghost_svc, txn_type is ''transfer'', and dest_account_id matches Meridian Dynamics accounts. SUM the amount column.", "unlock_after_minutes": 8},
        {"text": "Search the accounts table for account names containing ''Meridian''. Count the distinct accounts.", "unlock_after_minutes": 5},
        {"text": "Compare the count of audit_log entries where user_id matches ghost_svc and action is ''INSERT'' against the total ghost_svc transactions. Express as a percentage.", "unlock_after_minutes": 10}
    ]'::jsonb,
    '[
        {"filename": "stage_2_complete.md", "content": "", "path": "intel/stage_2_complete.md"}
    ]'::jsonb,
    25,
    30
);

-- Stage 3: Build the Case (Python)
INSERT INTO stages (id, mission_id, sort_order, title, briefing, skill_primary, skills_secondary, objectives, hints, intel_drops, par_time_minutes, par_lines)
VALUES (
    'c3d4e5f6-0003-4000-8000-000000000001',
    'b2c3d4e5-0001-4000-8000-000000000001',
    3,
    'Build the Case',
    'Write a Python script to compile all evidence into a structured report. Query the database, aggregate the findings, and output a JSON evidence file.',
    'python',
    ARRAY['sql'],
    '[
        {
            "id": "create_report_script",
            "title": "Create Report Script",
            "description": "Create a Python script at /novapay/evidence_report.py",
            "validator": {"type": "file_exists", "path": "/novapay/evidence_report.py"},
            "is_bonus": false,
            "points": 10
        },
        {
            "id": "generate_report",
            "title": "Generate Report",
            "description": "Run your script to generate /novapay/evidence.json",
            "validator": {"type": "file_exists", "path": "/novapay/evidence.json"},
            "is_bonus": false,
            "points": 15
        },
        {
            "id": "report_has_total",
            "title": "Verify Report Data",
            "description": "Evidence report must contain the correct total amount diverted",
            "validator": {"type": "json_schema_match", "path": "/novapay/evidence.json", "schema": {"required_fields": ["total_diverted", "transaction_count", "suspect_accounts"], "field_checks": {"total_diverted": {"type": "number", "min": 2314000, "max": 2315000}, "transaction_count": {"type": "number", "min": 840, "max": 855}}}},
            "is_bonus": false,
            "points": 25
        },
        {
            "id": "report_has_timeline",
            "title": "Include Timeline",
            "description": "Evidence report includes a timeline of fraudulent activity",
            "validator": {"type": "json_schema_match", "path": "/novapay/evidence.json", "schema": {"required_fields": ["timeline"], "field_checks": {"timeline": {"type": "array", "min_length": 1}}}},
            "is_bonus": false,
            "points": 20
        },
        {
            "id": "bonus_identify_perpetrator",
            "title": "Identify Perpetrator",
            "description": "Include the perpetrator identity in the report (bonus: +20 XP)",
            "validator": {"type": "json_schema_match", "path": "/novapay/evidence.json", "schema": {"required_fields": ["perpetrator"]}},
            "is_bonus": true,
            "points": 20
        }
    ]'::jsonb,
    '[
        {"text": "Create a Python file at /novapay/evidence_report.py. It should connect to PostgreSQL and query the fraud data.", "unlock_after_minutes": 3},
        {"text": "Your script should output a JSON file at /novapay/evidence.json. Run it with: python3 /novapay/evidence_report.py", "unlock_after_minutes": 5},
        {"text": "Your JSON report needs: total_diverted (~2314887.43), transaction_count (~847), and suspect_accounts (array).", "unlock_after_minutes": 8},
        {"text": "Add a ''timeline'' array with entries showing when fraud occurred — e.g., monthly summaries with dates and amounts.", "unlock_after_minutes": 10}
    ]'::jsonb,
    '[
        {"filename": "debrief.md", "content": "", "path": "intel/debrief.md"}
    ]'::jsonb,
    15,
    50
);
