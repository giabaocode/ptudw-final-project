import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import {
  Users,
  Package,
  Tag,
  ArrowUpCircle,
  Trash2,
  Edit,
  Plus,
  Search,
  X,
  Check,
  Eye,
} from "lucide-react";
import { createPortal } from "react-dom";

// --- TYPES ---
interface Category {
  id: number;
  name: string;
  parent_name?: string;
  product_count: number;
  parent_id?: number | null;
}
interface Product {
  id: number;
  name: string;
  current_price: string;
  seller_name: string;
  created_at: string;
  category_name: string;
}
interface User {
  id: number;
  full_name: string;
  email: string;
  user_type: string;
  seller_expiry_date?: string;
  address?: string;
}
interface Request {
  id: number;
  full_name: string;
  email: string;
  requested_at: string;
}

export const AdminDashboard = ({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) => {
  const [tab, setTab] = useState<"cats" | "prods" | "users">("users");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [showCatModal, setShowCatModal] = useState(false);
  // Data State
  const [cats, setCats] = useState<Category[]>([]);
  const [prods, setProds] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reqs, setReqs] = useState<Request[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [catToDelete, setCatToDelete] = useState<Category | null>(null);

  // Editing State
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [parentId, setParentId] = useState<number | "">("");

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [tempRole, setTempRole] = useState("");

  // --- API HELPER ---
  const apiFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options?.headers },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Lỗi API");
    return data;
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      if (tab === "cats") {
        const data = await apiFetch("/api/admin/categories");
        setCats(data.categories);
      } else if (tab === "prods") {
        const data = await apiFetch("/api/admin/products");
        setProds(data.products);
      } else if (tab === "users") {
        const [uData, rData] = await Promise.all([
          apiFetch("/api/admin/users"),
          apiFetch("/api/admin/upgrade-requests"),
        ]);
        setUsers(uData.users);
        setReqs(rData.requests);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [tab]);

  // --- HANDLERS ---
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setTempRole(user.user_type);
    setShowUserModal(true);
  };

  const handleSaveUserRole = async () => {
    if (!editingUser) return;
    try {
      await apiFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({ user_type: tempRole }),
      });
      toast.success("Cập nhật vai trò thành công!");
      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...u, user_type: tempRole } : u
        )
      );
      setShowUserModal(false);
      setEditingUser(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi cập nhật");
    }
  };

  const handleEditCatClick = (cat: Category) => {
    setEditingCat(cat);
    setNewCatName(cat.name);
    setParentId(cat.parent_id || "");
    setShowCatModal(true);
  };

  const handleOpenCreateModal = () => {
    setEditingCat(null);
    setNewCatName("");
    setParentId("");
    setShowCatModal(true);
  };

  const handleSaveCategory = async () => {
    if (!newCatName.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    try {
      if (editingCat) {
        await apiFetch(`/api/admin/categories/${editingCat.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: newCatName,
            parent_id: parentId || null,
          }),
        });
        toast.success("Cập nhật danh mục thành công");
      } else {
        await apiFetch("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: newCatName,
            parent_id: parentId || undefined,
          }),
        });
        toast.success("Thêm danh mục thành công");
      }
      setShowCatModal(false);
      setEditingCat(null);
      setNewCatName("");
      setParentId("");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleOpenDeleteModal = (cat: Category) => {
    setCatToDelete(cat);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!catToDelete) return;
    try {
      await apiFetch(`/api/admin/categories/${catToDelete.id}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa danh mục thành công");
      loadAll();
      setShowDeleteModal(false);
      setCatToDelete(null);
    } catch (e: any) {
      toast.error(e.message);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteProd = async (id: number) => {
    if (!confirm("Gỡ sản phẩm này khỏi hệ thống?")) return;
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: "DELETE" });
      toast.success("Đã gỡ bỏ sản phẩm");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Xóa người dùng này vĩnh viễn?")) return;
    try {
      await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      toast.success("Đã xóa người dùng");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleApproveUpgrade = async (id: number) => {
    try {
      await apiFetch(`/api/admin/upgrade-requests/${id}/approve`, {
        method: "POST",
      });
      toast.success("Đã duyệt lên Seller (7 ngày)");
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // --- RENDER UI ---
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full shadow-xl z-10">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold tracking-wide text-blue-400">
            ADMIN CP
          </h2>
          <p className="text-xs text-gray-400 mt-1">Hệ thống quản trị</p>
        </div>

        {/* CLEAN NAV: Sử dụng class điều kiện */}
        <nav className="flex-1 p-4 space-y-2">
          {/* 1. NÚT USERS */}
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-3 w-full p-3 rounded transition-all ${
              tab === "users"
                ? "bg-blue-600 text-white font-bold shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" /> Quản lý Người dùng
          </button>

          {/* 2. NÚT CATEGORIES */}
          <button
            onClick={() => setTab("cats")}
            className={`flex items-center gap-3 w-full p-3 rounded transition-all ${
              tab === "cats"
                ? "bg-blue-600 text-white font-bold shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <Tag className="w-5 h-5" /> Quản lý Danh mục
          </button>

          {/* 3. NÚT PRODUCTS */}
          <button
            onClick={() => setTab("prods")}
            className={`flex items-center gap-3 w-full p-3 rounded transition-all ${
              tab === "prods"
                ? "bg-blue-600 text-white font-bold shadow-md"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <Package className="w-5 h-5" /> Quản lý Sản phẩm
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 text-gray-400 hover:text-white w-full transition-colors"
          >
            <ArrowUpCircle className="w-5 h-5 rotate-[-90deg]" /> Về trang chủ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {tab === "users" && "Người dùng & Phân quyền"}
            {tab === "cats" && "Danh mục sản phẩm"}
            {tab === "prods" && "Kho sản phẩm toàn hệ thống"}
          </h1>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
            Admin: <span className="font-bold text-blue-600">Super Admin</span>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="loader">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* === TAB USERS === */}
            {tab === "users" && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden mb-8">
                  <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                      <ArrowUpCircle className="w-5 h-5" /> Yêu cầu nâng cấp
                      Seller ({reqs.length})
                    </h3>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-blue-50/50 text-blue-900 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3">Người dùng</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Ngày gửi</th>
                        <th className="px-6 py-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {reqs.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-gray-400 italic"
                          >
                            Hiện không có yêu cầu nào.
                          </td>
                        </tr>
                      )}
                      {reqs.map((r) => (
                        <tr key={r.id} className="hover:bg-blue-50/30">
                          <td className="px-6 py-4 font-medium">
                            {r.full_name}
                          </td>
                          <td className="px-6 py-4">{r.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(r.requested_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right gap-2 flex justify-end">
                            <button className="px-3 py-1 text-xs font-bold text-red-600 bg-red-100 rounded hover:bg-red-200">
                              Từ chối
                            </button>
                            <button
                              onClick={() => handleApproveUpgrade(r.id)}
                              className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Duyệt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between">
                    <h3 className="font-bold text-gray-800">
                      Danh sách toàn bộ người dùng
                    </h3>
                    <div className="relative w-64">
                      {/* Icon kính lúp */}
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />

                      {/* CLEAN INPUT: Dùng class pl-input-lg thay vì style inline */}
                      <input
                        placeholder="Tìm kiếm..."
                        className="w-full pl-input-lg pr-4 py-2 text-sm border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all focus:bg-white"
                      />
                    </div>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Thông tin</th>
                        <th className="px-6 py-3">Vai trò</th>
                        <th className="px-6 py-3">Hết hạn Seller</th>
                        <th className="px-6 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 text-gray-500">#{u.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {u.full_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {u.email}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                u.user_type === "admin"
                                  ? "bg-black text-white"
                                  : u.user_type === "seller"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {u.user_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {u.seller_expiry_date
                              ? new Date(
                                  u.seller_expiry_date
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(u)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              title="Sửa vai trò"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* === TAB CATEGORIES === */}
            {tab === "cats" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-lg">
                    Danh sách danh mục
                  </h3>
                  {/* Clean Button */}
                  <button
                    onClick={handleOpenCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Thêm danh mục
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cats.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all group"
                    >
                      <div>
                        <div className="font-bold text-gray-800">{c.name}</div>
                        <div className="text-xs text-gray-500 flex gap-2 mt-1">
                          {c.parent_name && (
                            <span className="bg-blue-50 text-blue-600 px-1.5 rounded">
                              Thuộc: {c.parent_name}
                            </span>
                          )}
                          <span className="bg-gray-100 px-1.5 rounded">
                            {c.product_count} sản phẩm
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditCatClick(c)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(c)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* === TAB PRODUCTS === */}
            {tab === "prods" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Sản phẩm</th>
                      <th className="px-6 py-3">Người bán</th>
                      <th className="px-6 py-3">Danh mục</th>
                      <th className="px-6 py-3">Giá</th>
                      <th className="px-6 py-3 text-right">Xử lý</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {prods.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-gray-500">#{p.id}</td>
                        <td className="px-6 py-4 font-medium text-blue-600">
                          {p.name}
                        </td>
                        <td className="px-6 py-4 text-sm">{p.seller_name}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {p.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          ${Number(p.current_price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteProd(p.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium hover:underline"
                          >
                            Gỡ bỏ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {/* 1. MODAL EDIT USER */}
      {mounted &&
        showUserModal &&
        editingUser &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowUserModal(false)}
            />
            <div className="relative bg-white rounded-xl shadow-2xl border-2 border-black w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 z-10">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">Cập nhật người dùng</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Form fields... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên người dùng
                  </label>
                  <input
                    disabled
                    value={editingUser.full_name}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
                {/* ... other inputs ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò (Role)
                  </label>
                  <select
                    value={tempRole}
                    onChange={(e) => setTempRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                  >
                    <option value="bidder">Bidder (Người mua)</option>
                    <option value="seller">Seller (Người bán)</option>
                    <option value="admin">Admin (Quản trị)</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSaveUserRole}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 2. MODAL CATEGORY */}
      {mounted &&
        showCatModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCatModal(false)}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md border-2 border-black overflow-hidden animate-in fade-in zoom-in duration-200 z-10">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">
                  {editingCat ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                </h3>
                <button
                  onClick={() => setShowCatModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên danh mục
                  </label>
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ví dụ: Đồ điện tử..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh mục cha (Tùy chọn)
                  </label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(Number(e.target.value) || "")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {cats
                      .filter((c) => !c.parent_id)
                      .filter((c) => !editingCat || c.id !== editingCat.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                {/* CLEAN BUTTON: Dùng class chuẩn bg-green-100 text-green-800 */}
                <button
                  onClick={handleSaveCategory}
                  className="px-4 py-2 text-sm font-bold bg-green-100 text-green-800 hover:bg-green-200 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  {editingCat ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {editingCat ? "Lưu thay đổi" : "Tạo mới"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 3. MODAL DELETE CATEGORY */}
      {mounted &&
        showDeleteModal &&
        catToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="relative bg-white rounded-xl shadow-2xl border-2 border-black w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 z-10">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
                <h3 className="font-bold text-red-700 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" /> Xóa danh mục
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Bạn có chắc chắn muốn xóa danh mục:
                </p>
                <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 font-bold text-gray-800 text-center mb-4">
                  {catToDelete.name}
                </div>
                <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded border border-yellow-100 flex gap-2 items-start">
                  <span>
                    Nếu danh mục này đang chứa sản phẩm, hệ thống sẽ{" "}
                    <b>không cho phép xóa</b> để đảm bảo an toàn dữ liệu.
                  </span>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                {/* CLEAN BUTTON: Dùng class chuẩn bg-red-100 text-red-800 */}
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-bold bg-red-100 text-red-800 hover:bg-red-200 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
