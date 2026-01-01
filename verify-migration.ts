import { getClasses } from "./app/actions/classes";
import { getTerms } from "./app/actions/academic";

async function verifyMigration() {
    console.log("--- Verifying Academic Schema ---");

    const classResult = await getClasses();
    if (classResult.success) {
        console.log("✅ Classes table access: OK");
    } else {
        console.log("❌ Classes table access: FAILED", classResult.error);
    }

    const termResult = await getTerms();
    if (termResult.success) {
        console.log("✅ Terms table access: OK");
    } else {
        console.log("❌ Terms table access: FAILED", termResult.error);
    }
}

verifyMigration().catch(console.error);
