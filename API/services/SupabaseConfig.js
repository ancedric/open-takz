import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iifdsjpgwgxvsojdhjox.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZmRzanBnd2d4dnNvamRoam94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MTgxNDAsImV4cCI6MjA0Njk5NDE0MH0.tutKIDJLLxErxWqL6_p1KpAKV0DDwO3r8GY44fQ_wzE'
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase