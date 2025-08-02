import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      *,
      categories(name)
    `
    )
    .order("name");

  if (filters.category_id) {
    query = query.eq("category_id", filters.category_id);
  }

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters.brand) {
    query = query.ilike("brand", `%${filters.brand}%`);
  }

  if (filters.lowStock) {
    query = query.lt("stock", filters.lowStock);
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
      *,
      users(email)
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

  if (filters.hideDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const createSale = async (saleData) => {
  const { data, error } = await supabase
    .from("sales")
    .insert([saleData])
    .select();

  if (error) throw error;
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
  return data[0];
};

export const updateItemStock = async (itemId, quantitySold) => {
  const { data, error } = await supabase.rpc("decrease_item_stock", {
    item_id: itemId,
    quantity: quantitySold,
  });

  if (error) throw error;
  return data;
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
