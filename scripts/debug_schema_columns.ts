
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);


async function inspectSchema() {
    console.log("--- CHECKING ACADEMIC YEARS ---");
    const { data, error } = await supabase
        .from("academic_years")
        .select("id, name, is_current")
        .limit(1);

    if (error) {
        console.log("QUERY ERROR (is_current likely missing):", error.message);
    } else {
        console.log("QUERY SUCCESS: is_current exists.");
    }
    console.log("--- DONE ---");
}


inspectSchema();
