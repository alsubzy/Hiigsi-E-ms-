import { createClient } from "./lib/supabase/server";

async function checkSubjectSchema() {
    const supabase = await createClient();

    console.log("--- Checking Subjects Table Schema ---");

    // Check columns
    const { data: cols, error } = await supabase.rpc('get_table_columns', { table_name: 'subjects' });

    if (error) {
        // RPC might not exist, try a direct query if possible via supabase.from().select()
        console.log("RPC failed, trying raw query via information_schema");
        const { data, error: qError } = await supabase.from('information_schema.columns' as any).select('column_name, is_nullable, data_type').eq('table_name', 'subjects');

        if (qError) {
            console.error("Failed to query information_schema:", qError);
        } else {
            console.table(data);
        }
    } else {
        console.table(cols);
    }
}

checkSubjectSchema().catch(console.error);
