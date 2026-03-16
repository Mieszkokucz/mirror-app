-- Create user table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nick VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- create daily_reflection
CREATE TABLE daily_reflection(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_type  VARCHAR(30) NOT NULL CHECK (reflection_type IN ('morning', 'midday', 'evening')),
    date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date, reflection_type)

);

CREATE TRIGGER set_updated_at_daily_reflection
BEFORE UPDATE ON daily_reflection
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();



-- create periodic_reflection
CREATE TABLE periodic_reflection(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_type  VARCHAR(30) NOT NULL CHECK (reflection_type IN ('weekly', 'monthly')),
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date_from, date_to, reflection_type)
);

CREATE TRIGGER set_updated_at_periodic_reflection
BEFORE UPDATE ON periodic_reflection
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


-- create session
CREATE TABLE session(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()   
);

CREATE TRIGGER set_updated_at_session
BEFORE UPDATE ON session
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


-- create message
CREATE TABLE message(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW() 
);


-- seed data
INSERT INTO users (id, nick) VALUES ('b2769e58-414b-4d6e-b7b2-643db1616bda', 'FirstUser');
