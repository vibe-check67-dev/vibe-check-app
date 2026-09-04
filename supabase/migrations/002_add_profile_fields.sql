-- Add detailed profile fields for AI context
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS weight text,
ADD COLUMN IF NOT EXISTS height text,
ADD COLUMN IF NOT EXISTS biological_sex text,
ADD COLUMN IF NOT EXISTS diseases text,
ADD COLUMN IF NOT EXISTS food_allergies text,
ADD COLUMN IF NOT EXISTS dislikes_food text,
ADD COLUMN IF NOT EXISTS dislikes_music text,
ADD COLUMN IF NOT EXISTS dislikes_activities text;
