import { supabase } from "./src/utils/supabase.js";

console.log("🔍 Testing Supabase Connection...\n");

// Test 1: Check if environment variables are loaded
console.log("📋 Environment Variables:");
console.log(
  "VITE_SUPABASE_URL:",
  import.meta.env.VITE_SUPABASE_URL || "NOT SET"
);
console.log(
  "VITE_SUPABASE_ANON_KEY:",
  import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET (hidden)" : "NOT SET"
);

// Test 2: Check authentication status
console.log("\n🔐 Authentication Status:");
const { data: authData, error: authError } = await supabase.auth.getUser();
console.log("Auth Data:", authData);
console.log("Auth Error:", authError);

// Test 3: Try to connect to database
console.log("\n📊 Database Connection Tests:");

try {
  console.log("Testing categories table...");
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .limit(5);

  if (catError) {
    console.error("❌ Categories Error:", catError);
  } else {
    console.log("✅ Categories OK:", categories?.length || 0, "records");
  }
} catch (error) {
  console.error("❌ Categories Exception:", error.message);
}

try {
  console.log("Testing items table...");
  const { data: items, error: itemError } = await supabase
    .from("items")
    .select("*")
    .limit(5);

  if (itemError) {
    console.error("❌ Items Error:", itemError);
  } else {
    console.log("✅ Items OK:", items?.length || 0, "records");
  }
} catch (error) {
  console.error("❌ Items Exception:", error.message);
}

try {
  console.log("Testing sales table...");
  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("*")
    .limit(5);

  if (salesError) {
    console.error("❌ Sales Error:", salesError);
  } else {
    console.log("✅ Sales OK:", sales?.length || 0, "records");
  }
} catch (error) {
  console.error("❌ Sales Exception:", error.message);
}

try {
  console.log("Testing users table...");
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .limit(5);

  if (usersError) {
    console.error("❌ Users Error:", usersError);
  } else {
    console.log("✅ Users OK:", users?.length || 0, "records");
  }
} catch (error) {
  console.error("❌ Users Exception:", error.message);
}

// Test 4: Check RLS policies
console.log("\n🛡️  Row Level Security (RLS) Tests:");
try {
  // Test insert permission
  const { data: testInsert, error: insertError } = await supabase
    .from("categories")
    .insert({ name: "TEST_CATEGORY_" + Date.now() })
    .select();

  if (insertError) {
    console.error("❌ Insert Test Error:", insertError);
  } else {
    console.log("✅ Insert Test OK");
    // Clean up test data
    if (testInsert && testInsert[0]) {
      await supabase.from("categories").delete().eq("id", testInsert[0].id);
      console.log("🧹 Test data cleaned up");
    }
  }
} catch (error) {
  console.error("❌ Insert Test Exception:", error.message);
}

console.log("\n✅ Debugging complete!");
