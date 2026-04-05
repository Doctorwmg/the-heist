-- Initial schema for The Heist
-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    rank TEXT NOT NULL DEFAULT 'recruit',
    xp INTEGER NOT NULL DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_rank CHECK (rank IN ('recruit', 'operative', 'specialist', 'ghost', 'architect'))
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    narrative_intro TEXT,
    difficulty TEXT,
    mission_count INTEGER,
    is_free BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))
);

-- Missions
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    codename TEXT,
    description TEXT,
    narrative_briefing TEXT,
    difficulty TEXT,
    sort_order INTEGER,
    stage_count INTEGER,
    skills TEXT[] NOT NULL DEFAULT '{}',
    docker_image TEXT NOT NULL,
    time_limit_minutes INTEGER NOT NULL DEFAULT 120,
    par_time_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_mission_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))
);

-- Mission Stages
CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    briefing TEXT NOT NULL,
    skill_primary TEXT NOT NULL,
    skills_secondary TEXT[],
    objectives JSONB NOT NULL,
    hints JSONB,
    intel_drops JSONB,
    par_time_minutes INTEGER,
    par_lines INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Player Progress
CREATE TABLE player_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started',
    current_stage INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_time_seconds INTEGER,
    container_id TEXT,
    UNIQUE(user_id, mission_id),
    CONSTRAINT valid_status CHECK (status IN ('not_started', 'in_progress', 'completed'))
);

-- Stage Completions (detailed scoring)
CREATE TABLE stage_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    time_seconds INTEGER,
    lines_of_code INTEGER,
    attempts INTEGER NOT NULL DEFAULT 1,
    score INTEGER,
    bonus_objectives JSONB,
    solution_hash TEXT
);

-- Leaderboard (materialised view, refreshed on completion)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
    p.username,
    p.display_name,
    p.rank,
    p.avatar_url,
    m.slug AS mission_slug,
    m.title AS mission_title,
    c.slug AS campaign_slug,
    SUM(sc.score) AS total_score,
    SUM(sc.time_seconds) AS total_time,
    COUNT(DISTINCT sc.mission_id) AS missions_completed
FROM stage_completions sc
JOIN profiles p ON p.id = sc.user_id
JOIN missions m ON m.id = sc.mission_id
JOIN campaigns c ON c.id = m.campaign_id
GROUP BY p.username, p.display_name, p.rank, p.avatar_url,
         m.slug, m.title, c.slug
ORDER BY total_score DESC;

-- Unique index for fast refresh
CREATE UNIQUE INDEX leaderboard_unique_idx
ON leaderboard (username, mission_slug, campaign_slug);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_completions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own, everyone can read usernames for leaderboard
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable"
    ON profiles FOR SELECT USING (true);

-- Campaigns & Missions & Stages: readable by all authenticated users
CREATE POLICY "Campaigns are viewable by authenticated users"
    ON campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Missions are viewable by authenticated users"
    ON missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Stages are viewable by authenticated users"
    ON stages FOR SELECT TO authenticated USING (true);

-- Player Progress: users can only see/modify their own
CREATE POLICY "Users can view own progress"
    ON player_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress"
    ON player_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress"
    ON player_progress FOR UPDATE USING (auth.uid() = user_id);

-- Stage Completions: users can only see their own
CREATE POLICY "Users can view own completions"
    ON stage_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own completions"
    ON stage_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'operative_' || LEFT(NEW.id::text, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
