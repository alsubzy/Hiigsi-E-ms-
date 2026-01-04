
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reloadSchema() {
    console.log("Attempting to reload Supabase schema cache...");

    // Method 1: NOTIFY pgrst
    try {
        const { error } = await supabase.rpc('reload_schema_cache'); // Custom RPC if exists
        if (error) {
            console.log("Custom RPC 'reload_schema_cache' not found. Trying alternative.");
        } else {
            console.log("Schema cache reloaded via RPC!");
            return;
        }
    } catch (e) {
        console.log("Error invoking RPC:", e);
    }

    // Method 2: Raw SQL if we have a way (we don't easily from here without service key and sql func)
    // But we can try to verify the relationship first.

    console.log("Checking relationships...");
    // Check if we can query the new relationship
    const { data, error } = await supabase
        .from("invoices")
        .select("*, students(classes(name))")
        .limit(1);

    if (error) {
        console.error("Query Verification Failed:", error.message);
        console.log("\nIf you are seeing 'Could not find a relationship', you MUST:");
        console.log("1. Go to your Supabase Dashboard -> SQL Editor");
        console.log("2. Run: NOTIFY pgrst, 'reload config';");
        console.log("3. Alternatively, restart your project in Settings.");
    } else {
        console.log("Query Verification SUCCEEDED! The relationship is working.");
    }
}

reloadSchema();
