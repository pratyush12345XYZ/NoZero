import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiavrhipgprwfmbaqfdx.supabase.co';
const supabaseKey = 'sb_publishable_spd3qPw2v1MoIh7qmjSe_A_kwTtzbW9';

export const supabase = createClient(supabaseUrl, supabaseKey);
