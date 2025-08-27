import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // Use localStorage for persistence
    storageKey: "supabase.auth.token",
  },
});

// Helper function to invalidate cache after CRUD operations
const invalidateDataCache = (type) => {
  // Import dinamis untuk menghindari circular dependency
  import('@/stores/data.js').then(({ useDataStore }) => {
    const dataStore = useDataStore();
    dataStore.invalidateCache(type);
  }).catch(err => {
    console.warn('Could not invalidate cache:', err);
  });
};

// Database helper functions
export const getCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
};

export const getItems = async (filters = {}) => {
  let query = supabase
    .from("items")
    .select(
      `
      id,
      name,
      category_id,
      brand,
      model,
      price,
      stock,
      barcode,
      created_at,
      categories!inner(name)
    `
    )
    .order("name");

  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`
    );
  }

  if (filters.brand) {
    query = query.ilike("brand", `%${filters.brand}%`);
  }

  if (filters.lowStock) {
    query = query.lt("stock", filters.lowStock);
  }

  // Limit hasil jika tidak ada filter untuk performa yang lebih baik
  if (
    !filters.search &&
    !filters.category_id &&
    !filters.brand &&
    !filters.lowStock
  ) {
    query = query.limit(500); // Batasi ke 500 items untuk loading yang lebih cepat
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const getSales = async (filters = {}) => {
  let query = supabase
    .from("sales")
    .select(
      `
      id,
      employee_id,
      total,
      details,
      created_at,
      edited_by_admin,
      edit_log,
      is_deleted,
      paid,
      change,
      payment_timestamp,
      users!inner(email)
    `
    )
    .order("created_at", { ascending: false });

  if (filters.employee_id) {
    query = query.eq("employee_id", filters.employee_id);
  }

  if (filters.start_date) {
    query = query.gte("created_at", filters.start_date);
  }

  if (filters.end_date) {
    query = query.lte("created_at", filters.end_date);
  }

  if (filters.hideDeleted !== false) {
    query = query.eq("is_deleted", false);
  }

  // Filter berdasarkan status pembayaran jika diperlukan
  if (filters.paymentStatus === "paid") {
    query = query.not("paid", "is", null);
  } else if (filters.paymentStatus === "unpaid") {
    query = query.is("paid", null);
  }

  // Limit hasil untuk performa yang lebih baik - ambil 200 data terbaru
  if (!filters.employee_id && !filters.start_date && !filters.end_date) {
    query = query.limit(200);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const createSale = async (saleData) => {
  console.log("Creating sale with data:", saleData);

  const { data, error } = await supabase
    .from("sales")
    .insert([saleData])
    .select();

  if (error) {
    console.error("Error creating sale:", error);
    throw error;
  }

  console.log("Sale created successfully:", data[0]);
  
  // Invalidate sales and items cache
  invalidateDataCache('sales');
  invalidateDataCache('items'); // Items cache juga karena stok berubah
  
  return data[0];
};

export const createCategory = async (categoryData) => {
  const { data, error } = await supabase
    .from("categories")
    .insert([categoryData])
    .select();

  if (error) throw error;
  
  // Invalidate categories cache
  invalidateDataCache('categories');
  
  return data[0];
};

export const createItem = async (itemData) => {
  const { data, error } = await supabase
    .from("items")
    .insert([itemData])
    .select();

  if (error) throw error;
  
  // Invalidate items cache
  invalidateDataCache('items');
  
  return data[0];
};

export const updateSalePayment = async (saleId, paymentData) => {
  console.log("Updating payment for sale:", saleId, paymentData);

  // Update payment columns directly
  const updateData = {
    paid: paymentData.paid,
    change: paymentData.change,
    payment_timestamp: new Date().toISOString(),
  };

  console.log("Updating with data:", updateData);

  const { data, error } = await supabase
    .from("sales")
    .update(updateData)
    .eq("id", saleId)
    .select();

  if (error) {
    console.error("Error updating sale payment:", error);
    throw error;
  }

  console.log("Payment update result:", data[0]);
  
  // Invalidate sales cache after payment update
  invalidateDataCache('sales');
  
  return data[0];
};

export const updateSale = async (id, updates, userId, isAdmin = false) => {
  const { data: existingSale } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .single();

  const updateData = {
    ...updates,
    edit_log: {
      ...existingSale.edit_log,
      [`${new Date().toISOString()}`]: {
        previous_total: existingSale.total,
        new_total: updates.total,
        edited_by: userId,
        is_admin: isAdmin,
      },
    },
    edited_by_admin: isAdmin,
  };

  const { data, error } = await supabase
    .from("sales")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error) throw error;
  
  // Invalidate sales cache
  invalidateDataCache('sales');
  
  return data[0];
};

export const deleteSale = async (id, userId, isAdmin = false) => {
  const updateData = {
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    edit_log: {
      [`${new Date().toISOString()}`]: {
        action: "deleted",
        deleted_by: userId,
        is_admin: isAdmin,
      },
    },
  };

  const { data, error } = await supabase
    .from("sales")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error) throw error;
  
  // Invalidate sales cache
  invalidateDataCache('sales');
  
  return data[0];
};

export const updateItemStock = async (itemId, quantitySold) => {
  console.log(
    `Attempting to decrease stock for item ${itemId} by ${quantitySold}`
  );

  try {
    // Try to use the improved RPC function with row locking
    const { data, error } = await supabase.rpc("decrease_item_stock_safe", {
      item_id: itemId,
      quantity: quantitySold,
    });

    if (error) {
      console.error(`Stock update RPC failed for item ${itemId}:`, error);
      // If RPC function doesn't exist, fall back to manual update
      if (
        error.message &&
        error.message.includes("function decrease_item_stock_safe")
      ) {
        console.log("RPC function not found, falling back to manual update");
        return await updateItemStockManual(itemId, quantitySold);
      }
      throw error;
    }

    console.log("RPC response:", data);

    // Check if the operation was successful
    if (!data.success) {
      throw new Error(data.error);
    }

    console.log(`Stock update successful for item ${itemId}:`, data);
    
    // Invalidate items cache after stock update
    invalidateDataCache('items');
    
    return data;
  } catch (error) {
    console.error("Error in updateItemStock:", error);
    // If RPC fails, try manual update as fallback
    if (error.message && error.message.includes("function")) {
      console.log("Falling back to manual stock update");
      return await updateItemStockManual(itemId, quantitySold);
    }
    throw error;
  }
};

// Fallback manual update function
const updateItemStockManual = async (itemId, quantitySold) => {
  console.log(`Manual stock update for item ${itemId} by ${quantitySold}`);

  // Get current item with locking (simulate FOR UPDATE with immediate check)
  const { data: currentItem, error: fetchError } = await supabase
    .from("items")
    .select("id, name, stock")
    .eq("id", itemId)
    .single();

  if (fetchError) {
    throw new Error(`Gagal mengambil data barang: ${fetchError.message}`);
  }

  if (!currentItem) {
    throw new Error(`Barang tidak ditemukan`);
  }

  if (currentItem.stock < quantitySold) {
    throw new Error(
      `Stok ${currentItem.name} tidak mencukupi. Tersedia: ${currentItem.stock}, Diminta: ${quantitySold}`
    );
  }

  // Try to update with the exact conditions
  const newStock = currentItem.stock - quantitySold;
  const { data, error } = await supabase
    .from("items")
    .update({ stock: newStock })
    .eq("id", itemId)
    .eq("stock", currentItem.stock) // Optimistic locking
    .select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    // If no rows were updated, it means someone else changed the stock
    const { data: updatedItem } = await supabase
      .from("items")
      .select("stock")
      .eq("id", itemId)
      .single();

    throw new Error(
      `Stok sudah berubah. Stok saat ini: ${
        updatedItem?.stock || 0
      }. Silakan refresh dan coba lagi.`
    );
  }

  console.log(`Manual stock update successful:`, data[0]);
  
  // Invalidate items cache after manual stock update
  invalidateDataCache('items');
  
  return data[0];
};

export const getUsers = async (role = null) => {
  let query = supabase.from("users").select("*").order("email");

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};
