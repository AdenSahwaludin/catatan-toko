// Debug Supabase - For Browser Console
// Paste this code into your browser's developer console (F12)

console.log("🔍 Testing Supabase Connection from Browser...\n");

// Check if we're in the browser
if (typeof window === "undefined") {
  console.error("❌ This script must be run in the browser console");
} else {
  // Import the supabase instance (if available globally)
  // Or create a new one directly

  import("./src/utils/supabase.js")
    .then(async ({ supabase }) => {
      console.log("📦 Supabase client loaded");

      // Test 1: Check environment variables
      console.log("\n📋 Environment Check:");
      console.log("Location:", window.location.href);

      // Test 2: Check authentication
      console.log("\n🔐 Authentication Status:");
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      console.log("User:", authData?.user?.email || "Not authenticated");
      if (authError) console.error("Auth Error:", authError);

      // Test 3: Database connection tests
      console.log("\n📊 Database Tests:");

      const tables = [
        { name: "categories", description: "Categories table" },
        { name: "items", description: "Items table" },
        { name: "sales", description: "Sales table" },
        { name: "users", description: "Users table" },
      ];

      for (const table of tables) {
        try {
          console.log(`Testing ${table.description}...`);
          const { data, error, count } = await supabase
            .from(table.name)
            .select("*", { count: "exact" })
            .limit(1);

          if (error) {
            console.error(`❌ ${table.name} Error:`, error);
          } else {
            console.log(
              `✅ ${table.name} OK: ${count || data?.length || 0} total records`
            );
            if (data && data.length > 0) {
              console.log(`   Sample data:`, Object.keys(data[0]));
            }
          }
        } catch (err) {
          console.error(`❌ ${table.name} Exception:`, err.message);
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Test 4: Check if we can insert data
      console.log("\n🧪 Permission Tests:");
      try {
        const testName = "TEST_" + Date.now();
        const { data, error } = await supabase
          .from("categories")
          .insert({ name: testName })
          .select();

        if (error) {
          console.error("❌ Insert Test Failed:", error);
        } else {
          console.log("✅ Insert permissions OK");
          // Clean up
          await supabase.from("categories").delete().eq("id", data[0].id);
          console.log("🧹 Test data cleaned");
        }
      } catch (err) {
        console.error("❌ Insert Test Exception:", err.message);
      }

      console.log("\n✅ Browser debugging complete!");
      console.log("💡 If you see errors above, check:");
      console.log("   1. Supabase project is still active");
      console.log("   2. API keys are correct");
      console.log("   3. RLS policies allow your operations");
      console.log("   4. Tables exist in the database");
    })
    .catch((error) => {
      console.error("❌ Failed to load Supabase:", error);
    });
}
