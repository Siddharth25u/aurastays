"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ElementType, ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  CalendarDays,
  BarChart3,
  Star,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Plus,
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  IndianRupee,
  Pencil,
  Trash2,
  Eye,
  Check,
  UserPlus,
  Hotel as HotelIcon,
  CircleDollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Image as ImageIcon,
  Save,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type Page =
  | "Dashboard"
  | "Properties"
  | "Rooms"
  | "Bookings"
  | "Revenue"
  | "Reviews"
  | "Staff"
  | "Settings"
  | "Help & Support";

type BookingStatus = "Confirmed" | "Pending" | "Completed" | "Cancelled";
type RoomStatus = "Available" | "Occupied" | "Maintenance";

type Hotel = {
  id: string;
  name: string;
  slug: string;
  location: string;
  type: string;
  description: string;
  rating: number;
  review_count: number;
  image: string;
  created_at?: string;
  updated_at?: string;
};

type Room = {
  id: string;
  hotel_id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  max_guests: number;
  inventory_count: number;
  bed: string;
  size: string;
  image: string;
  amenities: string[];
  status: RoomStatus;
};

type Booking = {
  id: string;
  bookingNumber: string;
  guest: string;
  email: string;
  property: string;
  room: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: BookingStatus;
  paymentStatus: string;
};

type Review = {
  id: string;
  guest: string;
  property: string;
  rating: number;
  text: string;
  date: string;
  replied: boolean;
  reply?: string;
};

type StaffMember = {
  id: number;
  name: string;
  role: string;
  email: string;
  status: "Active" | "Inactive";
};

type Profile = {
  name: string;
  email: string;
  phone: string;
  role: string;
};

type Notice = { type: "error" | "success"; text: string };

/* =========================================================
   CONSTANTS
========================================================= */

const navigation: { label: Page; icon: ElementType }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Properties", icon: Building2 },
  { label: "Rooms", icon: BedDouble },
  { label: "Bookings", icon: CalendarDays },
  { label: "Revenue", icon: BarChart3 },
  { label: "Reviews", icon: Star },
  { label: "Staff", icon: Users },
];

const bottomNavigation: { label: Page; icon: ElementType }[] = [
  { label: "Settings", icon: Settings },
  { label: "Help & Support", icon: HelpCircle },
];

const HOTEL_COLUMNS =
  "id, name, slug, location, type, description, rating, review_count, image, created_at, updated_at";

const bookingStatuses: BookingStatus[] = [
  "Confirmed",
  "Pending",
  "Completed",
  "Cancelled",
];

const roomStatuses: RoomStatus[] = ["Available", "Occupied", "Maintenance"];

const searchPlaceholders: Partial<Record<Page, string>> = {
  Properties: "Search properties...",
  Rooms: "Search rooms...",
  Bookings: "Search bookings...",
  Reviews: "Search reviews...",
  Staff: "Search staff...",
};

/* =========================================================
   LOCAL DATA
   Hotels are NOT here. Hotels come directly from Supabase.
========================================================= */

const initialStaff: StaffMember[] = [
  { id: 1, name: "Aman Rawat", role: "Property Manager", email: "aman@staylux.com", status: "Active" },
  { id: 2, name: "Riya Sharma", role: "Front Desk", email: "riya@staylux.com", status: "Active" },
  { id: 3, name: "Karan Singh", role: "Housekeeping", email: "karan@staylux.com", status: "Inactive" },
];

const initialProfile: Profile = {
  name: "Siddharth Bhandari",
  email: "owner@staylux.com",
  phone: "+91 98765 43210",
  role: "Property Owner",
};

const emptyPropertyForm = {
  id: "",
  name: "",
  slug: "",
  location: "",
  type: "Hotel",
  description: "",
  image: "",
};

const emptyRoomForm = {
  id: "",
  hotel_id: "",
  name: "",
  type: "Deluxe",
  description: "",
  price: "4500",
  max_guests: "2",
  inventory_count: "1",
  bed: "",
  size: "",
  image: "",
  amenities: [] as string[],
  status: "Available" as RoomStatus,
};

/* =========================================================
   HELPERS
========================================================= */

function money(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Supabase errors are objects (often Error subclasses that print as `{}`), so read fields safely. */
function describeError(error: unknown) {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;
    return { message: e.message, code: e.code, details: e.details, hint: e.hint };
  }
  return String(error);
}

function errMsg(error: unknown, fallback: string) {
  let message = "";
  let code = "";

  if (error && typeof error === "object") {
    message = String((error as { message?: unknown }).message ?? "");
    code = String((error as { code?: unknown }).code ?? "");
  } else if (typeof error === "string") {
    message = error;
  }

  if (!message) return fallback;

  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "Supabase blocked this action (RLS). Log in as the owner and check that the table's policy allows it.";
  }
  if (code === "PGRST204" || /schema cache/i.test(message)) {
    return `${message}. Run the setup SQL to add the missing column, then try again.`;
  }
  if (/bucket not found/i.test(message)) {
    return "Storage bucket \"hotel-images\" was not found. Create it in Supabase → Storage and make it public.";
  }
  return message;
}

function isDuplicateError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { code?: unknown }).code === "23505"
  );
}

function toHotel(row: Record<string, unknown>): Hotel {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    location: String(row.location ?? ""),
    type: String(row.type ?? "Hotel"),
    description: String(row.description ?? ""),
    rating: Number(row.rating ?? 0),
    review_count: Number(row.review_count ?? 0),
    image: String(row.image ?? ""),
    created_at: (row.created_at as string | null) ?? undefined,
    updated_at: (row.updated_at as string | null) ?? undefined,
  };
}

function isMissingStatusColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; message?: unknown };
  const message = String(e.message ?? "");
  return (
    (e.code === "PGRST204" || /schema cache|does not exist/i.test(message)) &&
    /status/i.test(message)
  );
}

const AMENITY_OPTIONS = [
  "Wi-Fi",
  "Air conditioning",
  "Heater",
  "Television",
  "Breakfast included",
  "Room service",
  "Mini bar",
  "Coffee / tea maker",
  "Balcony",
  "Mountain view",
  "Garden view",
  "Pool view",
  "Private bathroom",
  "Hot water",
  "Bathtub",
  "Hair dryer",
  "Work desk",
  "Safe",
  "Wardrobe",
  "Iron",
  "Parking",
  "Pool access",
];

const IMAGE_BUCKET = "hotel-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Uploads a file to Supabase Storage and returns its public URL. */
async function uploadImage(file: File, folder: string) {
  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function toRoom(row: Record<string, unknown>): Room {
  const rawStatus = String(row.status ?? "Available");

  return {
    id: String(row.id),
    hotel_id: String(row.hotel_id),
    name: String(row.name ?? ""),
    type: String(row.type ?? ""),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    max_guests: Number(row.max_guests ?? 2),
    inventory_count: Number(row.inventory_count ?? 1),
    bed: String(row.bed ?? ""),
    size: String(row.size ?? ""),
    image: String(row.image ?? ""),
    amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : [],
    status: (roomStatuses as string[]).includes(rawStatus)
      ? (rawStatus as RoomStatus)
      : "Available",
  };
}

/** Revenue only counts bookings that are actually confirmed or finished. */
function isRevenueBooking(booking: Booking) {
  return booking.status === "Confirmed" || booking.status === "Completed";
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* =========================================================
   OWNER PAGE
========================================================= */

export default function OwnerPage() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  /* undefined = still checking, null = not logged in */
  const [authEmail, setAuthEmail] = useState<string | null | undefined>(
    undefined
  );
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  /* ---------- Supabase hotels ---------- */

  const [properties, setProperties] = useState<Hotel[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- Other app data ---------- */

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [profile, setProfile] = useState<Profile>(initialProfile);

  /* ---------- Search / filter ---------- */

  const [search, setSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState<"All" | BookingStatus>(
    "All"
  );

  /* ---------- Modals ---------- */

  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  /* ---------- Forms ---------- */

  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [propertySaving, setPropertySaving] = useState(false);
  const [propertyMessage, setPropertyMessage] = useState("");

  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [roomMessage, setRoomMessage] = useState("");
  const [roomSaving, setRoomSaving] = useState(false);

  const [staffForm, setStaffForm] = useState({
    name: "",
    role: "Front Desk",
    email: "",
  });
  const [staffMessage, setStaffMessage] = useState("");

  /* =======================================================
     LOAD HOTELS FROM SUPABASE
  ======================================================= */

  const loadProperties = useCallback(async () => {
    try {
      setPropertiesError("");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        setProperties([]);
        return;
      }

      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (roleError) throw roleError;

      if (!roleRow || !["owner", "admin"].includes(roleRow.role)) {
        setProperties([]);
        setPropertiesError("This account does not have owner or admin access.");
        return;
      }

      let query = supabase.from("hotels").select(HOTEL_COLUMNS);
      if (roleRow.role !== "admin") query = query.eq("owner_id", authData.user.id);
      const { data, error } = await query.order("created_at", { ascending: true });
      if (error) throw error;
      setProperties(((data ?? []) as Record<string, unknown>[]).map(toHotel));
    } catch (error) {
      console.warn("Supabase hotels error:", describeError(error));
      setPropertiesError(errMsg(error, "Hotels could not be loaded."));
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      setRoomsError("");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        setRooms([]);
        return;
      }

      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .maybeSingle();
      if (roleError) throw roleError;
      if (!roleRow || !["owner", "admin"].includes(roleRow.role)) {
        setRooms([]);
        return;
      }

      let hotelQuery = supabase.from("hotels").select("id");
      if (roleRow.role !== "admin") hotelQuery = hotelQuery.eq("owner_id", authData.user.id);
      const { data: ownedHotels, error: hotelsError } = await hotelQuery;
      if (hotelsError) throw hotelsError;
      const hotelIds = (ownedHotels ?? []).map((hotel) => hotel.id);
      if (hotelIds.length === 0) {
        setRooms([]);
        return;
      }

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .in("hotel_id", hotelIds)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setRooms(((data ?? []) as Record<string, unknown>[]).map(toRoom));
    } catch (error) {
      console.warn("Supabase rooms error:", describeError(error));
      setRoomsError(errMsg(error, "Rooms could not be loaded."));
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
    loadRooms();
  }, [loadProperties, loadRooms]);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setAuthEmail(data.user?.email ?? null);
        setAuthUserId(data.user?.id ?? null);
      })
      .catch(() => {
        setAuthEmail(null);
        setAuthUserId(null);
      });
  }, []);

  const loadOwnerBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_number, check_in, check_out, total, status, customers(first_name,last_name,email), hotels(name), rooms(name), payments(status)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const mapped = (data ?? []).map((row: any) => {
        const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
        const hotel = Array.isArray(row.hotels) ? row.hotels[0] : row.hotels;
        const room = Array.isArray(row.rooms) ? row.rooms[0] : row.rooms;
        const payment = Array.isArray(row.payments) ? row.payments[0] : row.payments;
        const rawStatus = String(row.status ?? "pending").toLowerCase();
        const status = rawStatus === "confirmed" ? "Confirmed"
          : rawStatus === "completed" ? "Completed"
          : rawStatus === "cancelled" || rawStatus === "canceled" ? "Cancelled" : "Pending";
        return {
          id: String(row.id),
          bookingNumber: String(row.booking_number ?? row.id),
          guest: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "Guest",
          email: String(customer?.email ?? ""),
          property: String(hotel?.name ?? "Property"),
          room: String(room?.name ?? "Room"),
          checkIn: String(row.check_in ?? ""),
          checkOut: String(row.check_out ?? ""),
          amount: Number(row.total ?? 0),
          status,
          paymentStatus: String(payment?.status ?? "pending").toLowerCase(),
        } satisfies Booking;
      });
      setBookings(mapped);
    } catch (error) {
      console.error("Owner bookings load error:", describeError(error));
      setNotice({ type: "error", text: errMsg(error, "Bookings could not be loaded.") });
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const loadOwnerReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, owner_reply, customers(first_name,last_name), hotels(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      setReviews((data ?? []).map((row: any) => {
        const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
        const hotel = Array.isArray(row.hotels) ? row.hotels[0] : row.hotels;
        return {
          id: String(row.id),
          guest: [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "Guest",
          property: String(hotel?.name ?? "Property"),
          rating: Number(row.rating ?? 0),
          text: String(row.comment ?? ""),
          date: row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN") : "",
          replied: Boolean(row.owner_reply),
          reply: row.owner_reply ? String(row.owner_reply) : undefined,
        };
      }));
    } catch (error) {
      console.error("Owner reviews load error:", describeError(error));
      setNotice({ type: "error", text: errMsg(error, "Reviews could not be loaded.") });
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authUserId) return;
    loadOwnerBookings();
    loadOwnerReviews();
  }, [authUserId, loadOwnerBookings, loadOwnerReviews]);

  async function refreshProperties() {
    setRefreshing(true);
    await Promise.all([loadProperties(), loadRooms()]);
    setRefreshing(false);
  }

  /* close notifications on outside click / Escape */

  useEffect(() => {
    if (!showNotifications) return;

    function onClick(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setShowNotifications(false);
    }

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showNotifications]);

  /* =======================================================
     PROPERTY ACTIONS
  ======================================================= */

  function openAddProperty() {
    setPropertyForm(emptyPropertyForm);
    setSlugTouched(false);
    setPropertyMessage("");
    setShowPropertyModal(true);
  }

  function openEditProperty(property: Hotel) {
    setPropertyForm({
      id: property.id,
      name: property.name,
      slug: property.slug,
      location: property.location,
      type: property.type,
      description: property.description,
      image: property.image,
    });
    setSlugTouched(true);
    setPropertyMessage("");
    setShowPropertyModal(true);
  }

  async function saveProperty() {
    const name = propertyForm.name.trim();
    const location = propertyForm.location.trim();
    const image = propertyForm.image.trim();

    if (!name) return setPropertyMessage("Property name is required.");
    if (!location) return setPropertyMessage("Location is required.");
    if (image && !/^https?:\/\//i.test(image)) {
      return setPropertyMessage(
        "Image URL must start with http:// or https://"
      );
    }

    setPropertySaving(true);
    setPropertyMessage("");

    try {
      const { data: currentUserData, error: currentUserError } = await supabase.auth.getUser();
      if (currentUserError) throw currentUserError;
      const currentUser = currentUserData.user;
      if (!currentUser) throw new Error("Please sign in before managing properties.");

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (roleError) throw roleError;
      if (!roleData || !["owner", "admin"].includes(roleData.role)) {
        throw new Error("Your account does not have owner or admin permissions yet. Ask an administrator to assign your role.");
      }

      const payload = {
        name,
        slug:
          createSlug(propertyForm.slug) ||
          createSlug(name) ||
          `property-${Date.now()}`,
        location,
        type: propertyForm.type.trim() || "Hotel",
        description: propertyForm.description.trim(),
        image,
        updated_at: new Date().toISOString(),
      };

      /* ---------- UPDATE ---------- */

      if (propertyForm.id) {
        const { data, error } = await supabase
          .from("hotels")
          .update(payload)
          .eq("id", propertyForm.id)
          .select(HOTEL_COLUMNS)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error(
            "Nothing was updated. Check that your Supabase RLS policy allows updating the hotels table."
          );
        }

        const updated = toHotel(data as Record<string, unknown>);
        const previous = properties.find((hotel) => hotel.id === updated.id);

        setProperties((current) =>
          current.map((hotel) => (hotel.id === updated.id ? updated : hotel))
        );

        /* keep local rooms / bookings / reviews linked after a rename */
        if (previous && previous.name !== updated.name) {
          const oldName = previous.name;
          const newName = updated.name;
          setBookings((c) =>
            c.map((b) => (b.property === oldName ? { ...b, property: newName } : b))
          );
          setReviews((c) =>
            c.map((r) => (r.property === oldName ? { ...r, property: newName } : r))
          );
        }

        setShowPropertyModal(false);
        setNotice({ type: "success", text: `"${updated.name}" was updated.` });
        return;
      }

      /* ---------- INSERT ---------- */

      const { data, error } = await supabase
        .from("hotels")
        .insert({ ...payload, owner_id: currentUser.id, rating: 0, review_count: 0 })
        .select(HOTEL_COLUMNS)
        .single();

      if (error) throw error;

      if (data) {
        const created = toHotel(data as Record<string, unknown>);
        setProperties((current) => [...current, created]);
        setNotice({ type: "success", text: `"${created.name}" was created.` });
      }

      setShowPropertyModal(false);
      setPropertyForm(emptyPropertyForm);
    } catch (error) {
      console.warn("Save property error:", describeError(error));
      setPropertyMessage(
        isDuplicateError(error)
          ? "A property with this slug already exists. Please change the slug."
          : errMsg(error, "Property could not be saved.")
      );
    } finally {
      setPropertySaving(false);
    }
  }

  async function deleteProperty(id: string) {
    const target = properties.find((hotel) => hotel.id === id);

    const confirmed = window.confirm(
      `Are you sure you want to delete ${target ? `"${target.name}"` : "this property"}?`
    );
    if (!confirmed) return;

    try {
      const { data, error } = await supabase
        .from("hotels")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) throw error;

      /* RLS can silently block deletes (0 rows, no error) */
      if (!data || data.length === 0) {
        throw new Error(
          "Nothing was deleted. Check that your Supabase RLS policy allows deleting from the hotels table."
        );
      }

      setProperties((current) => current.filter((hotel) => hotel.id !== id));
      setRooms((current) => current.filter((room) => room.hotel_id !== id));
      setNotice({ type: "success", text: "Property deleted." });
    } catch (error) {
      console.warn("Delete hotel error:", describeError(error));
      const linked =
        !!error &&
        typeof error === "object" &&
        (error as { code?: unknown }).code === "23503";

      setNotice({
        type: "error",
        text: linked
          ? "This property still has rooms or bookings linked to it. Delete its rooms first, then try again."
          : errMsg(error, "Property could not be deleted."),
      });
    }
  }

  /* =======================================================
     FILTERED LISTS
  ======================================================= */

  const query = search.trim().toLowerCase();
  const matches = (...values: string[]) =>
    !query || values.some((value) => value.toLowerCase().includes(query));

  const filteredProperties = useMemo(
    () =>
      properties.filter((p) => matches(p.name, p.location, p.type, p.slug)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [properties, query]
  );

  const hotelName = (hotelId: string) =>
    properties.find((hotel) => hotel.id === hotelId)?.name ?? "Unknown property";

  const filteredRooms = useMemo(
    () =>
      rooms.filter((r) =>
        matches(
          r.name,
          properties.find((hotel) => hotel.id === r.hotel_id)?.name ?? "",
          r.type,
          r.status
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rooms, properties, query]
  );

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (bookingFilter === "All" || b.status === bookingFilter) &&
          matches(b.guest, b.property, b.id, b.email, b.room)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings, bookingFilter, query]
  );

  const filteredReviews = useMemo(
    () => reviews.filter((r) => matches(r.guest, r.property, r.text)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reviews, query]
  );

  const filteredStaff = useMemo(
    () => staff.filter((s) => matches(s.name, s.role, s.email)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [staff, query]
  );

  /* =======================================================
     DASHBOARD STATS (real data, no fake offsets)
  ======================================================= */

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "Occupied").length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;

  const totalRevenue = bookings
    .filter(isRevenueBooking)
    .reduce((sum, booking) => sum + booking.amount, 0);

  const pendingBookings = bookings.filter((b) => b.status === "Pending").length;
  const unrepliedReviews = reviews.filter((r) => !r.replied).length;
  const maintenanceRooms = rooms.filter((r) => r.status === "Maintenance");

  /* =======================================================
     NAVIGATION
  ======================================================= */

  function navigate(page: Page) {
    setActivePage(page);
    setSidebarOpen(false);
    setShowNotifications(false);
    setNotice(null);
    setSearch("");
  }

  /* =======================================================
     ROOMS
  ======================================================= */

  function openAddRoom() {
    setRoomForm({ ...emptyRoomForm, hotel_id: properties[0]?.id ?? "" });
    setRoomMessage("");
    setShowRoomModal(true);
  }

  function openEditRoom(room: Room) {
    setRoomForm({
      id: room.id,
      hotel_id: room.hotel_id,
      name: room.name,
      type: room.type,
      description: room.description,
      price: String(room.price),
      max_guests: String(room.max_guests),
      inventory_count: String(room.inventory_count ?? 1),
      bed: room.bed,
      size: room.size,
      image: room.image,
      amenities: room.amenities,
      status: room.status,
    });
    setRoomMessage("");
    setShowRoomModal(true);
  }

  async function saveRoom(skipStatus = false) {
    const name = roomForm.name.trim();
    const price = Number(roomForm.price);
    const maxGuests = Number(roomForm.max_guests);
    const inventoryCount = Number(roomForm.inventory_count);
    const image = roomForm.image.trim();
    const statusNote = skipStatus
      ? " (Room status was not saved. Add the status column with the setup SQL.)"
      : "";

    if (!roomForm.hotel_id) {
      return setRoomMessage("Create a property first, then add rooms to it.");
    }
    if (!name) return setRoomMessage("Room name is required.");
    if (!Number.isFinite(price) || price <= 0) {
      return setRoomMessage("Enter a price greater than 0.");
    }
    if (!Number.isInteger(maxGuests) || maxGuests < 1) {
      return setRoomMessage("Max guests must be at least 1.");
    }
    if (!Number.isInteger(inventoryCount) || inventoryCount < 1) {
      return setRoomMessage("Physical room inventory must be at least 1.");
    }
    if (image && !/^https?:\/\//i.test(image)) {
      return setRoomMessage("Image URL must start with http:// or https://");
    }

    setRoomSaving(true);
    setRoomMessage("");

    try {
      const payload = {
        hotel_id: roomForm.hotel_id,
        name,
        type: roomForm.type.trim() || null,
        description: roomForm.description.trim() || null,
        price,
        max_guests: maxGuests,
        inventory_count: inventoryCount,
        bed: roomForm.bed.trim() || null,
        size: roomForm.size.trim() || null,
        image: image || null,
        amenities: roomForm.amenities,
        ...(skipStatus ? {} : { status: roomForm.status }),
        updated_at: new Date().toISOString(),
      };

      /* ---------- UPDATE ---------- */

      if (roomForm.id) {
        const { data, error } = await supabase
          .from("rooms")
          .update(payload)
          .eq("id", roomForm.id)
          .select("*")
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          throw new Error(
            "Nothing was updated. Check that your Supabase RLS policy allows updating the rooms table."
          );
        }

        const updated = toRoom(data as Record<string, unknown>);
        setRooms((current) =>
          current.map((room) => (room.id === updated.id ? updated : room))
        );
        setShowRoomModal(false);
        setNotice({
          type: "success",
          text: `"${updated.name}" was updated.${statusNote}`,
        });
        return;
      }

      /* ---------- INSERT ---------- */

      const { data, error } = await supabase
        .from("rooms")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      const created = toRoom(data as Record<string, unknown>);
      setRooms((current) => [...current, created]);
      setShowRoomModal(false);
      setNotice({
        type: "success",
        text: `"${created.name}" was added.${statusNote}`,
      });
    } catch (error) {
      console.warn("Save room error:", describeError(error));

      /* the rooms table has no `status` column yet: save everything else */
      if (!skipStatus && isMissingStatusColumn(error)) {
        return saveRoom(true);
      }

      setRoomMessage(errMsg(error, "Room could not be saved."));
    } finally {
      setRoomSaving(false);
    }
  }

  async function deleteRoom(id: string) {
    if (!window.confirm("Delete this room?")) return;

    try {
      const { data, error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "Nothing was deleted. Check that your Supabase RLS policy allows deleting from the rooms table."
        );
      }

      setRooms((current) => current.filter((room) => room.id !== id));
    } catch (error) {
      console.warn("Delete room error:", describeError(error));
      setNotice({
        type: "error",
        text: errMsg(error, "Room could not be deleted."),
      });
    }
  }

  async function updateRoomStatus(id: string, status: RoomStatus) {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id");

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "Nothing was updated. Check that your Supabase RLS policy allows updating the rooms table."
        );
      }

      setRooms((current) =>
        current.map((room) => (room.id === id ? { ...room, status } : room))
      );
    } catch (error) {
      console.warn("Update room status error:", describeError(error));
      setNotice({
        type: "error",
        text: errMsg(error, "Room status could not be changed."),
      });
    }
  }

  /* =======================================================
     STAFF
  ======================================================= */

  function openAddStaff() {
    setStaffForm({ name: "", role: "Front Desk", email: "" });
    setStaffMessage("");
    setShowStaffModal(true);
  }

  function addStaff() {
    const name = staffForm.name.trim();
    const email = staffForm.email.trim();

    if (!name) return setStaffMessage("Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setStaffMessage("Enter a valid email address.");
    }
    if (staff.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return setStaffMessage("A staff member with this email already exists.");
    }

    setStaff((current) => [
      ...current,
      { id: Date.now(), name, role: staffForm.role, email, status: "Active" },
    ]);
    setShowStaffModal(false);
  }

  function deleteStaff(id: number) {
    if (!window.confirm("Remove this staff member?")) return;
    setStaff((current) => current.filter((member) => member.id !== id));
  }

  function toggleStaffStatus(id: number) {
    setStaff((current) =>
      current.map((member) =>
        member.id === id
          ? {
              ...member,
              status: member.status === "Active" ? "Inactive" : "Active",
            }
          : member
      )
    );
  }

  /* =======================================================
     BOOKINGS
  ======================================================= */

  async function updateBookingStatus(id: string, status: BookingStatus) {
    if (status !== "Confirmed") return;
    const booking = bookings.find((item) => item.id === id);
    if (!booking || booking.status !== "Pending" || booking.paymentStatus !== "pending") {
      setNotice({ type: "error", text: "Only unpaid pending bookings can be verified here." });
      return;
    }
    setBookingActionId(id);
    try {
      const { error } = await supabase.rpc("confirm_manual_payment", { p_booking_id: id });
      if (error) throw error;
      await loadOwnerBookings();
      setNotice({ type: "success", text: `Manual payment verified for ${booking.bookingNumber}.` });
    } catch (error) {
      console.error("Manual payment confirmation error:", describeError(error));
      setNotice({ type: "error", text: errMsg(error, "Payment could not be verified.") });
    } finally {
      setBookingActionId(null);
    }
  }

  function exportBookings() {
    downloadCsv("bookings.csv", [
      ["Booking ID", "Guest", "Email", "Property", "Room", "Check-in", "Check-out", "Amount (INR)", "Status", "Payment"],
      ...bookings.map((b) => [
        b.bookingNumber, b.guest, b.email, b.property, b.room, b.checkIn, b.checkOut, b.amount, b.status, b.paymentStatus,
      ]),
    ]);
  }

  /* =======================================================
     REVIEWS
  ======================================================= */

  function openReply(review: Review) {
    setReplyTarget(review);
    setReplyText(review.reply ?? "");
  }

  async function sendReply() {
    if (!replyTarget || !replyText.trim()) return;
    const id = replyTarget.id;
    const text = replyText.trim();
    const { error } = await supabase
      .from("reviews")
      .update({ owner_reply: text, owner_replied_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      console.error("Review reply error:", describeError(error));
      setNotice({ type: "error", text: errMsg(error, "Reply could not be saved.") });
      return;
    }
    setReviews((current) => current.map((review) =>
      review.id === id ? { ...review, replied: true, reply: text } : review
    ));
    setReplyTarget(null);
    setReplyText("");
    setNotice({ type: "success", text: "Your reply has been saved." });
  }

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  const notifications: { title: string; description: string }[] = [];

  if (pendingBookings > 0) {
    notifications.push({
      title: `${pendingBookings} booking${pendingBookings > 1 ? "s" : ""} awaiting confirmation`,
      description: "Open Bookings to confirm or cancel them.",
    });
  }
  if (unrepliedReviews > 0) {
    notifications.push({
      title: `${unrepliedReviews} review${unrepliedReviews > 1 ? "s" : ""} need a reply`,
      description: "Guests are waiting to hear from you.",
    });
  }
  maintenanceRooms.forEach((room) =>
    notifications.push({
      title: "Room under maintenance",
      description: `${room.name} at ${hotelName(room.hotel_id)} is unavailable.`,
    })
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#17212B]">
      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-[#E5E9EE] bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[82px] items-center justify-between border-b border-[#E5E9EE] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17212B]">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold">StayLux</h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8A949F]">
                Owner
              </p>
            </div>
          </div>

          <button
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-[#7D8791] hover:bg-[#F3F5F7] lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9AA3AC]">
            Management
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.label)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#EAF2F1] text-[#176B61]"
                      : "text-[#69747F] hover:bg-[#F5F7F8] hover:text-[#17212B]"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>

                  {item.label === "Bookings" && pendingBookings > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#17212B] px-1.5 text-[10px] font-semibold text-white">
                      {pendingBookings}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9AA3AC]">
            Account
          </p>

          <nav className="space-y-1">
            {bottomNavigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.label)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                    active
                      ? "bg-[#EAF2F1] text-[#176B61]"
                      : "text-[#69747F] hover:bg-[#F5F7F8]"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-[#E5E9EE] p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCE8E6] text-sm font-semibold text-[#176B61]">
              {initials(profile.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile.name}</p>
              <p className="truncate text-xs text-[#8A949F]">{profile.role}</p>
            </div>
            <ChevronDown size={17} className="text-[#89939D]" />
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <div className="lg:ml-[260px]">
        {/* TOP BAR */}

        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-[#E5E9EE] bg-white/95 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-[#E5E9EE] p-2.5 text-[#56616C] lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:block">
              <p className="text-xs text-[#8A949F]">Owner Portal</p>
              <p className="text-sm font-semibold">{activePage}</p>
            </div>
          </div>

          <div className="hidden w-[300px] md:block">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholders[activePage] ?? "Search..."}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              <button
                aria-label="Notifications"
                onClick={() => setShowNotifications((value) => !value)}
                className="relative rounded-xl p-2.5 text-[#68737E] hover:bg-[#F3F5F7]"
              >
                <Bell size={19} />
                {notifications.length > 0 && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#176B61]" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[#E3E8EC] bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <span className="text-xs text-[#89939D]">
                      {notifications.length} new
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {notifications.length === 0 ? (
                      <p className="rounded-xl bg-[#F7F9FA] p-3 text-xs text-[#89939D]">
                        You&apos;re all caught up.
                      </p>
                    ) : (
                      notifications.map((item, index) => (
                        <Notification
                          key={index}
                          title={item.title}
                          description={item.description}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mx-1 hidden h-7 w-px bg-[#E5E9EE] sm:block" />

            <button
              aria-label="Account"
              onClick={() => navigate("Settings")}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#F5F7F8]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DCE8E6] text-xs font-semibold text-[#176B61]">
                {initials(profile.name)}
              </div>
              <ChevronDown size={15} className="text-[#8B959E]" />
            </button>
          </div>
        </header>

        {/* MOBILE SEARCH */}

        <div className="border-b border-[#E5E9EE] bg-white px-5 py-3 md:hidden">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={searchPlaceholders[activePage] ?? "Search..."}
          />
        </div>

        {/* PAGE CONTENT */}

        <section className="px-5 py-7 lg:px-8 lg:py-9">
          {authEmail === null && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              You&apos;re not logged in, so Supabase will block saving rooms and
              properties.{" "}
              <a href="/login" className="font-semibold underline">
                Log in as the owner
              </a>
            </div>
          )}

          {authEmail && (
            <p className="mb-4 text-xs text-[#89939D]">
              Signed in as{" "}
              <span className="font-semibold text-[#56616C]">{authEmail}</span>
            </p>
          )}

          {notice && (
            <div
              role="status"
              className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border p-4 text-sm ${
                notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[#CFE6DF] bg-[#EAF4F0] text-[#176B61]"
              }`}
            >
              <span>{notice.text}</span>
              <button
                aria-label="Dismiss"
                onClick={() => setNotice(null)}
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {activePage === "Dashboard" && (
            <Dashboard
              firstName={profile.name.split(" ")[0] || "there"}
              properties={properties}
              bookings={bookings}
              totalRevenue={totalRevenue}
              totalRooms={totalRooms}
              occupiedRooms={occupiedRooms}
              availableRooms={availableRooms}
              loading={propertiesLoading}
              onAddProperty={openAddProperty}
              onNavigate={navigate}
            />
          )}

          {activePage === "Properties" && (
            <PropertiesPage
              properties={filteredProperties}
              loading={propertiesLoading}
              error={propertiesError}
              refreshing={refreshing}
              onRefresh={refreshProperties}
              onAdd={openAddProperty}
              onEdit={openEditProperty}
              onDelete={deleteProperty}
            />
          )}

          {activePage === "Rooms" && (
            <RoomsPage
              rooms={filteredRooms}
              loading={roomsLoading}
              error={roomsError}
              refreshing={refreshing}
              hotelName={hotelName}
              onRefresh={refreshProperties}
              onAdd={openAddRoom}
              onEdit={openEditRoom}
              onDelete={deleteRoom}
              onStatusChange={updateRoomStatus}
            />
          )}

          {activePage === "Bookings" && (
            <BookingsPage
              bookings={filteredBookings}
              filter={bookingFilter}
              setFilter={setBookingFilter}
              onStatusChange={updateBookingStatus}
              actionId={bookingActionId}
              loading={bookingsLoading}
              onExport={exportBookings}
            />
          )}

          {activePage === "Revenue" && (
            <RevenuePage totalRevenue={totalRevenue} bookings={bookings} />
          )}

          {activePage === "Reviews" && (
            <ReviewsPage
              reviews={filteredReviews}
              allReviews={reviews}
              onReply={openReply}
              loading={reviewsLoading}
            />
          )}

          {activePage === "Staff" && (
            <StaffPage
              staff={filteredStaff}
              onAdd={openAddStaff}
              onDelete={deleteStaff}
              onToggle={toggleStaffStatus}
            />
          )}

          {activePage === "Settings" && (
            <SettingsPage profile={profile} onSave={setProfile} />
          )}

          {activePage === "Help & Support" && <HelpPage />}
        </section>
      </div>

      {/* PROPERTY MODAL */}

      {showPropertyModal && (
        <Modal
          title={propertyForm.id ? "Edit Property" : "Add Property"}
          description={
            propertyForm.id
              ? "Update your hotel information and property image."
              : "Create a new hotel property in StayLux."
          }
          onClose={() => setShowPropertyModal(false)}
        >
          <div className="space-y-4">
            <Field
              label="Property name"
              value={propertyForm.name}
              onChange={(value) =>
                setPropertyForm((form) => ({
                  ...form,
                  name: value,
                  slug: slugTouched ? form.slug : createSlug(value),
                }))
              }
              placeholder="The Grand Himalayan"
            />

            <Field
              label="Slug"
              value={propertyForm.slug}
              onChange={(value) => {
                setSlugTouched(true);
                setPropertyForm((form) => ({ ...form, slug: value }));
              }}
              placeholder="grand-himalayan"
            />

            <Field
              label="Location"
              value={propertyForm.location}
              onChange={(value) =>
                setPropertyForm((form) => ({ ...form, location: value }))
              }
              placeholder="Dehradun, Uttarakhand"
            />

            <SelectField
              label="Property type"
              value={propertyForm.type}
              options={[
                "Hotel",
                "Luxury Hotel",
                "Resort",
                "Heritage Hotel",
                "Mountain Resort",
                "Villa",
                "Boutique Hotel",
              ]}
              onChange={(value) =>
                setPropertyForm((form) => ({ ...form, type: value }))
              }
            />

            <TextAreaField
              label="Description"
              value={propertyForm.description}
              onChange={(value) =>
                setPropertyForm((form) => ({ ...form, description: value }))
              }
              placeholder="Describe your property..."
            />

            <ImageUploadField
              label="Property image"
              folder="hotels"
              value={propertyForm.image}
              onChange={(image) =>
                setPropertyForm((form) => ({ ...form, image }))
              }
            />

            {propertyMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium leading-5 text-red-600"
              >
                {propertyMessage}
              </div>
            )}

            <button
              onClick={saveProperty}
              disabled={propertySaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#273542] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {propertySaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {propertyForm.id ? "Save Changes" : "Create Property"}
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* ROOM MODAL */}

      {showRoomModal && (
        <Modal
          title={roomForm.id ? "Edit Room" : "Add Room"}
          description="Rooms are saved to your StayLux database and shown on the main site."
          onClose={() => setShowRoomModal(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Property</label>
              <select
                value={roomForm.hotel_id}
                onChange={(event) =>
                  setRoomForm((form) => ({
                    ...form,
                    hotel_id: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-[#E3E8EC] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#176B61]"
              >
                {properties.length === 0 ? (
                  <option value="">No properties yet</option>
                ) : (
                  properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <Field
              label="Room name"
              value={roomForm.name}
              onChange={(value) =>
                setRoomForm((form) => ({ ...form, name: value }))
              }
              placeholder="Deluxe Room 204"
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Room type"
                value={roomForm.type}
                options={["Deluxe", "Suite", "Standard", "Premium", "Villa"]}
                onChange={(value) =>
                  setRoomForm((form) => ({ ...form, type: value }))
                }
              />
              <SelectField
                label="Status"
                value={roomForm.status}
                options={roomStatuses}
                onChange={(value) =>
                  setRoomForm((form) => ({
                    ...form,
                    status: value as RoomStatus,
                  }))
                }
              />
            </div>

            <TextAreaField
              label="Description"
              value={roomForm.description}
              onChange={(value) =>
                setRoomForm((form) => ({ ...form, description: value }))
              }
              placeholder="Describe the room..."
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Price / night (₹)"
                type="number"
                value={roomForm.price}
                onChange={(value) =>
                  setRoomForm((form) => ({ ...form, price: value }))
                }
              />
              <Field
                label="Max guests"
                type="number"
                value={roomForm.max_guests}
                onChange={(value) =>
                  setRoomForm((form) => ({ ...form, max_guests: value }))
                }
              />
              <Field
                label="Physical rooms in this category"
                type="number"
                value={roomForm.inventory_count}
                onChange={(value) =>
                  setRoomForm((form) => ({ ...form, inventory_count: value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Bed"
                value={roomForm.bed}
                onChange={(value) =>
                  setRoomForm((form) => ({ ...form, bed: value }))
                }
                placeholder="1 King Bed"
              />
              <Field
                label="Size"
                value={roomForm.size}
                onChange={(value) =>
                  setRoomForm((form) => ({ ...form, size: value }))
                }
                placeholder="35 m²"
              />
            </div>

            <AmenitiesPicker
              selected={roomForm.amenities}
              onChange={(amenities) =>
                setRoomForm((form) => ({ ...form, amenities }))
              }
            />

            <ImageUploadField
              label="Room image"
              folder="rooms"
              value={roomForm.image}
              onChange={(image) =>
                setRoomForm((form) => ({ ...form, image }))
              }
            />

            {roomMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium leading-5 text-red-600"
              >
                {roomMessage}
              </div>
            )}

            <button
              onClick={() => saveRoom()}
              disabled={roomSaving || properties.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#273542] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {roomSaving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  {roomForm.id ? "Save Changes" : "Create Room"}
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* STAFF MODAL */}

      {showStaffModal && (
        <Modal
          title="Add Staff Member"
          description="Give a staff member access to property operations."
          onClose={() => setShowStaffModal(false)}
        >
          <div className="space-y-4">
            <Field
              label="Full name"
              value={staffForm.name}
              onChange={(value) =>
                setStaffForm((form) => ({ ...form, name: value }))
              }
            />

            <Field
              label="Email"
              type="email"
              value={staffForm.email}
              onChange={(value) =>
                setStaffForm((form) => ({ ...form, email: value }))
              }
            />

            <SelectField
              label="Role"
              value={staffForm.role}
              options={[
                "Property Manager",
                "Front Desk",
                "Housekeeping",
                "Accountant",
              ]}
              onChange={(value) =>
                setStaffForm((form) => ({ ...form, role: value }))
              }
            />

            {staffMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium leading-5 text-red-600"
              >
                {staffMessage}
              </div>
            )}

            <button
              onClick={addStaff}
              className="w-full rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#273542]"
            >
              Add Staff
            </button>
          </div>
        </Modal>
      )}

      {/* REVIEW REPLY MODAL */}

      {replyTarget && (
        <Modal
          title="Reply to guest"
          description={`${replyTarget.guest} · ${replyTarget.property}`}
          onClose={() => setReplyTarget(null)}
        >
          <div className="space-y-4">
            <p className="rounded-xl bg-[#F7F9FA] p-3 text-sm leading-6 text-[#596570]">
              {replyTarget.text}
            </p>

            <TextAreaField
              label="Your reply"
              value={replyText}
              onChange={setReplyText}
              placeholder="Thank you for staying with us..."
            />

            <button
              onClick={sendReply}
              disabled={!replyText.trim()}
              className="w-full rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#273542] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send reply
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  firstName,
  properties,
  bookings,
  totalRevenue,
  totalRooms,
  occupiedRooms,
  availableRooms,
  loading,
  onAddProperty,
  onNavigate,
}: {
  firstName: string;
  properties: Hotel[];
  bookings: Booking[];
  totalRevenue: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  loading: boolean;
  onAddProperty: () => void;
  onNavigate: (page: Page) => void;
}) {
  /* date + greeting are set after mount to avoid server/client mismatch */
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const dateLabel = now
    ? now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "\u00A0";

  const hour = now?.getHours() ?? 12;
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const occupancy =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-[#176B61]">{dateLabel}</p>
          <h2 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em]">
            {greeting}, {firstName}
          </h2>
          <p className="mt-1.5 text-sm text-[#7D8791]">
            Here&apos;s an overview of your properties today.
          </p>
        </div>

        <button
          onClick={onAddProperty}
          className="flex w-fit items-center gap-2 rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#273542]"
        >
          <Plus size={18} />
          Add Property
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<IndianRupee size={19} />}
          label="Total Revenue"
          value={money(totalRevenue)}
        />
        <StatCard
          icon={<CalendarDays size={19} />}
          label="Bookings"
          value={String(bookings.length)}
        />
        <StatCard
          icon={<BedDouble size={19} />}
          label="Occupied Rooms"
          value={`${occupiedRooms} / ${totalRooms}`}
        />
        <StatCard
          icon={<Building2 size={19} />}
          label="Properties"
          value={loading ? "—" : String(properties.length)}
          change="LIVE"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <RevenueCard totalRevenue={totalRevenue} bookings={bookings} />

        <div className="rounded-2xl border border-[#E3E8EC] bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#7D8791]">Occupancy</p>
              <h3 className="mt-1 text-2xl font-semibold">{occupancy}%</h3>
            </div>
            <ArrowUpRight size={18} className="text-[#7D8791]" />
          </div>

          <div className="mt-8 flex items-center justify-center">
            <div
              className="relative flex h-44 w-44 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#176B61 ${occupancy}%, #DDEBE8 ${occupancy}% 100%)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                <p className="text-3xl font-semibold">{occupancy}%</p>
                <p className="mt-1 text-xs text-[#8A949F]">Occupied</p>
              </div>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3">
            <MiniMetric label="Occupied" value={String(occupiedRooms)} />
            <MiniMetric label="Available" value={String(availableRooms)} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        {/* BOOKINGS */}

        <div className="overflow-hidden rounded-2xl border border-[#E3E8EC] bg-white">
          <div className="flex items-center justify-between border-b border-[#E8ECEF] px-6 py-5">
            <div>
              <h3 className="font-semibold">Recent Bookings</h3>
              <p className="mt-1 text-xs text-[#89939D]">
                Latest reservations across your properties
              </p>
            </div>
            <button
              onClick={() => onNavigate("Bookings")}
              className="text-xs font-semibold text-[#176B61] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-[#E8ECEF] text-left text-[11px] uppercase tracking-wider text-[#929BA4]">
                  <th className="px-6 py-3">Guest</th>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 4).map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PROPERTIES */}

        <div className="rounded-2xl border border-[#E3E8EC] bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Your Properties</h3>
              <p className="mt-1 text-xs text-[#89939D]">
                {loading ? "Loading..." : `${properties.length} properties`}
              </p>
            </div>
            <button
              onClick={() => onNavigate("Properties")}
              className="text-xs font-semibold text-[#176B61]"
            >
              View all
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-[#F3F5F6]"
                />
              ))
            ) : properties.length === 0 ? (
              <p className="rounded-xl bg-[#F7F9FA] p-4 text-xs text-[#89939D]">
                No properties yet. Add your first one to get started.
              </p>
            ) : (
              properties.slice(0, 4).map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-3 rounded-xl border border-[#E8ECEF] p-3"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#EAF2F1]">
                    <PropertyImage
                      src={property.image}
                      alt={property.name}
                      className="h-full w-full object-cover"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center text-[#176B61]">
                          <Building2 size={18} />
                        </div>
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {property.name}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-[#89939D]">
                      <MapPin size={11} />
                      {property.location}
                    </p>
                  </div>

                  <span className="text-[10px] text-[#89939D]">
                    {property.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   PROPERTIES
========================================================= */

function PropertiesPage({
  properties,
  loading,
  error,
  refreshing,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
}: {
  properties: Hotel[];
  loading: boolean;
  error: string;
  refreshing: boolean;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (property: Hotel) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Management"
        title="Properties"
        description="Manage every hotel and property directly from your StayLux database."
        action={
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-[#E3E8EC] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={onAdd}
              className="flex items-center gap-2 rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus size={18} />
              Add Property
            </button>
          </div>
        }
      />

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">
            Could not load hotels
          </p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
          <p className="mt-3 text-xs text-red-500">
            Check your Supabase RLS policies if the error mentions permission
            denied.
          </p>
        </div>
      )}

      {loading ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-[380px] animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : properties.length === 0 && !error ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="No properties found"
          description="Create your first StayLux property, or clear your search."
        />
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <div
              key={property.id}
              className="overflow-hidden rounded-2xl border border-[#E3E8EC] bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#DDEBE8] to-[#F3F6F7]">
                <PropertyImage
                  src={property.image}
                  alt={property.name}
                  className="h-full w-full object-cover transition duration-500 hover:scale-105"
                  fallback={
                    <div className="flex h-full items-center justify-center text-[#176B61]">
                      <HotelIcon size={54} />
                    </div>
                  }
                />

                <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
                  {property.type}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{property.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#89939D]">
                      <MapPin size={12} />
                      {property.location}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-[#EAF4F0] px-2.5 py-1 text-[10px] font-semibold text-[#176B61]">
                    LIVE
                  </span>
                </div>

                <p className="mt-4 line-clamp-2 text-xs leading-5 text-[#68737E]">
                  {property.description || "No property description added yet."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniMetric
                    label="Rating"
                    value={
                      property.rating
                        ? `${property.rating.toFixed(1)} ★`
                        : "New"
                    }
                  />
                  <MiniMetric
                    label="Reviews"
                    value={String(property.review_count)}
                  />
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        `/?hotel=${encodeURIComponent(property.slug)}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E3E8EC] py-2.5 text-xs font-semibold hover:bg-[#F7F9FA]"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    aria-label={`Edit ${property.name}`}
                    onClick={() => onEdit(property)}
                    className="rounded-xl border border-[#E3E8EC] p-2.5 text-[#66717C] hover:bg-[#F7F9FA]"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    aria-label={`Delete ${property.name}`}
                    onClick={() => onDelete(property.id)}
                    className="rounded-xl border border-red-100 p-2.5 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* =========================================================
   ROOMS
========================================================= */

function RoomsPage({
  rooms,
  loading,
  error,
  refreshing,
  hotelName,
  onRefresh,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  rooms: Room[];
  loading: boolean;
  error: string;
  refreshing: boolean;
  hotelName: (hotelId: string) => string;
  onRefresh: () => void;
  onAdd: () => void;
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: RoomStatus) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Rooms"
        description="Rooms and prices saved here are shown live on your main site."
        action={
          <div className="flex gap-2">
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-[#E3E8EC] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={onAdd}
              className="flex items-center gap-2 rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus size={18} />
              Add Room
            </button>
          </div>
        }
      />

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-700">
            Could not load rooms
          </p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
          <p className="mt-3 text-xs text-red-500">
            Check your Supabase RLS policies on the rooms table if the error
            mentions permission denied.
          </p>
        </div>
      )}

      {loading ? (
        <div className="mt-7 space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-16 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : rooms.length === 0 && !error ? (
        <EmptyState
          icon={<BedDouble size={28} />}
          title="No rooms found"
          description="Add a room to a property so guests can see its price and book it, or clear your search."
        />
      ) : (
        rooms.length > 0 && (
          <div className="mt-7 overflow-hidden rounded-2xl border border-[#E3E8EC] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#E8ECEF] text-left text-[11px] uppercase tracking-wider text-[#929BA4]">
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Guests</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {rooms.map((room) => (
                    <tr
                      key={room.id}
                      className="border-b border-[#EDF0F2] last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#EAF2F1]">
                            <PropertyImage
                              src={room.image}
                              alt={room.name}
                              className="h-full w-full object-cover"
                              fallback={
                                <div className="flex h-full w-full items-center justify-center text-[#176B61]">
                                  <BedDouble size={18} />
                                </div>
                              }
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{room.name}</p>
                            {(room.bed || room.size) && (
                              <p className="mt-0.5 text-[10px] text-[#89939D]">
                                {[room.bed, room.size]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs text-[#68737E]">
                        {hotelName(room.hotel_id)}
                      </td>
                      <td className="px-6 py-4 text-xs">{room.type || "—"}</td>

                      <td className="px-6 py-4 text-sm font-semibold">
                        {money(room.price)}
                        <span className="ml-1 text-[10px] font-normal text-[#89939D]">
                          / night
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        {room.max_guests} guests
                      </td>

                      <td className="px-6 py-4">
                        <StatusSelect
                          value={room.status}
                          options={roomStatuses}
                          onChange={(status) => onStatusChange(room.id, status)}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button
                            aria-label={`Edit ${room.name}`}
                            onClick={() => onEdit(room)}
                            className="rounded-lg p-2 text-[#66717C] hover:bg-[#F3F5F7]"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            aria-label={`Delete ${room.name}`}
                            onClick={() => onDelete(room.id)}
                            className="rounded-lg p-2 text-red-400 hover:bg-red-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </>
  );
}

/* =========================================================
   BOOKINGS
========================================================= */

function BookingsPage({
  bookings,
  filter,
  setFilter,
  onStatusChange,
  actionId,
  loading,
  onExport,
}: {
  bookings: Booking[];
  filter: "All" | BookingStatus;
  setFilter: (filter: "All" | BookingStatus) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  actionId: string | null;
  loading: boolean;
  onExport: () => void;
}) {
  const filters: ("All" | BookingStatus)[] = ["All", ...bookingStatuses];

  return (
    <>
      <PageHeader
        eyebrow="Reservations"
        title="Bookings"
        description="Track reservations, guests, dates and booking status."
      />

      <div className="mt-7 rounded-2xl border border-[#E3E8EC] bg-white">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E8ECEF] p-5 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  filter === item
                    ? "bg-[#17212B] text-white"
                    : "bg-[#F5F7F8] text-[#69747F]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            onClick={onExport}
            className="flex items-center gap-2 rounded-lg border border-[#E3E8EC] px-3 py-2 text-xs font-semibold hover:bg-[#F7F9FA]"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>

        {loading ? (
          <p className="px-6 py-14 text-center text-sm text-[#89939D]">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-[#89939D]">
            No bookings match your filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#E8ECEF] text-left text-[11px] uppercase tracking-wider text-[#929BA4]">
                  <th className="px-6 py-4">Booking</th>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Property / Room</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Quick action</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-[#EDF0F2] last:border-0"
                  >
                    <td className="px-6 py-4 text-xs font-semibold">
                      {booking.bookingNumber}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold">{booking.guest}</p>
                      <p className="mt-1 text-[10px] text-[#89939D]">
                        {booking.email}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold">
                        {booking.property}
                      </p>
                      <p className="mt-1 text-[10px] text-[#89939D]">
                        {booking.room}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-xs text-[#68737E]">
                      {booking.checkIn}
                      <br />
                      <span className="text-[#A0A8B0]">
                        to {booking.checkOut}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold">
                      {money(booking.amount)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <StatusBadge status={booking.status} />
                        <p className="text-[10px] text-[#89939D]">Payment: {booking.paymentStatus}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {booking.status === "Pending" && booking.paymentStatus === "pending" ? (
                        <button
                          type="button"
                          disabled={actionId === booking.id}
                          onClick={() => onStatusChange(booking.id, "Confirmed")}
                          className="rounded-lg bg-[#EAF4F0] px-3 py-2 text-xs font-semibold text-[#176B61] disabled:opacity-50"
                        >
                          {actionId === booking.id ? "Verifying..." : "Verify manual payment"}
                        </button>
                      ) : (
                        <span className="text-xs text-[#A0A8B0]">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   REVENUE
========================================================= */

function RevenuePage({
  totalRevenue,
  bookings,
}: {
  totalRevenue: number;
  bookings: Booking[];
}) {
  const paid = bookings.filter(isRevenueBooking);
  const averageBooking = paid.length
    ? Math.round(totalRevenue / paid.length)
    : 0;

  function exportReport() {
    downloadCsv("revenue-report.csv", [
      ["Booking ID", "Guest", "Property", "Amount (INR)", "Status"],
      ...paid.map((b) => [b.id, b.guest, b.property, b.amount, b.status]),
      [],
      ["Total", "", "", totalRevenue, ""],
    ]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Financials"
        title="Revenue"
        description="Monitor property performance and booking revenue."
        action={
          <button
            onClick={exportReport}
            className="flex items-center gap-2 rounded-xl border border-[#E3E8EC] bg-white px-4 py-3 text-sm font-semibold"
          >
            <Download size={17} />
            Export Report
          </button>
        }
      />

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<CircleDollarSign size={19} />}
          label="Total Revenue"
          value={money(totalRevenue)}
        />
        <StatCard
          icon={<TrendingUp size={19} />}
          label="Average Booking"
          value={money(averageBooking)}
        />
        <StatCard
          icon={<CalendarDays size={19} />}
          label="Paid Bookings"
          value={String(paid.length)}
        />
      </div>

      <div className="mt-5">
        <RevenueCard totalRevenue={totalRevenue} bookings={bookings} />
      </div>
    </>
  );
}

/* =========================================================
   REVIEWS
========================================================= */

function ReviewsPage({
  reviews,
  allReviews,
  onReply,
  loading,
}: {
  reviews: Review[];
  allReviews: Review[];
  onReply: (review: Review) => void;
  loading: boolean;
}) {
  const average = allReviews.length
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
      allReviews.length
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Guest Experience"
        title="Reviews"
        description="Monitor guest feedback and respond to reviews."
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="h-fit rounded-2xl border border-[#E3E8EC] bg-white p-6">
          <p className="text-sm text-[#89939D]">Overall rating</p>

          <div className="mt-3 flex items-center gap-3">
            <p className="text-4xl font-semibold">{average.toFixed(1)}</p>
            <div>
              <div className="text-[#E4B84D]">★★★★★</div>
              <p className="mt-1 text-xs text-[#89939D]">
                {allReviews.length} reviews
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <p className="rounded-2xl border border-dashed border-[#DCE2E6] bg-white px-6 py-12 text-center text-sm text-[#89939D]">Loading reviews...</p>
          ) : reviews.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#DCE2E6] bg-white px-6 py-12 text-center text-sm text-[#89939D]">
              No reviews match your search.
            </p>
          )}

          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-[#E3E8EC] bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DCE8E6] text-sm font-semibold text-[#176B61]">
                    {initials(review.guest)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.guest}</p>
                    <p className="mt-1 text-xs text-[#89939D]">
                      {review.property} · {review.date}
                    </p>
                  </div>
                </div>

                <div
                  className="text-[#E4B84D]"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {"★".repeat(review.rating)}
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-[#596570]">
                {review.text}
              </p>

              {review.reply && (
                <div className="mt-4 rounded-xl bg-[#F7F9FA] p-4">
                  <p className="text-[11px] font-semibold text-[#176B61]">
                    Your reply
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#596570]">
                    {review.reply}
                  </p>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                {review.replied && (
                  <span className="flex items-center gap-1.5 rounded-lg bg-[#EAF4F0] px-3 py-2 text-xs font-semibold text-[#176B61]">
                    <Check size={14} />
                    Replied
                  </span>
                )}

                <button
                  onClick={() => onReply(review)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    review.replied
                      ? "border border-[#E3E8EC] text-[#56616C]"
                      : "bg-[#17212B] text-white"
                  }`}
                >
                  {review.replied ? "Edit reply" : "Reply to guest"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   STAFF
========================================================= */

function StaffPage({
  staff,
  onAdd,
  onDelete,
  onToggle,
}: {
  staff: StaffMember[];
  onAdd: () => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Staff"
        description="Manage the people helping you run your properties."
        action={
          <button
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white"
          >
            <UserPlus size={17} />
            Add Staff
          </button>
        }
      />

      {staff.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No staff found"
          description="Add a staff member or clear your search."
        />
      ) : (
        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {staff.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-[#E3E8EC] bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DCE8E6] text-sm font-semibold text-[#176B61]">
                    {initials(member.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{member.name}</p>
                    <p className="mt-1 text-xs text-[#89939D]">
                      {member.role}
                    </p>
                  </div>
                </div>

                <StatusBadge status={member.status} />
              </div>

              <div className="mt-5 space-y-2 text-xs text-[#68737E]">
                <p className="flex items-center gap-2 break-all">
                  <Mail size={14} className="shrink-0" />
                  {member.email}
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck size={14} />
                  Staff access
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => onToggle(member.id)}
                  className="flex-1 rounded-xl border border-[#E3E8EC] py-2.5 text-xs font-semibold hover:bg-[#F7F9FA]"
                >
                  {member.status === "Active" ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => onDelete(member.id)}
                  className="flex-1 rounded-xl border border-red-100 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (profile: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [bookingNotifications, setBookingNotifications] = useState(true);
  const [reviewNotifications, setReviewNotifications] = useState(true);

  function update(key: keyof Profile, value: string) {
    setSaved(false);
    setError("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    if (!draft.name.trim()) return setError("Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      return setError("Enter a valid email address.");
    }

    onSave({
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      role: draft.role.trim() || "Property Owner",
    });
    setSaved(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Configure your owner account and notification preferences."
      />

      <div className="mt-7 max-w-4xl space-y-5">
        <SettingsCard
          title="Owner Profile"
          description="Basic information associated with your owner account."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Full name"
              value={draft.name}
              onChange={(value) => update("name", value)}
            />
            <Field
              label="Email"
              type="email"
              value={draft.email}
              onChange={(value) => update("email", value)}
            />
            <Field
              label="Phone"
              type="tel"
              value={draft.phone}
              onChange={(value) => update("phone", value)}
            />
            <Field
              label="Role"
              value={draft.role}
              onChange={(value) => update("role", value)}
            />
          </div>

          {error && <p className="mt-4 text-xs text-red-600">{error}</p>}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={save}
              className="flex items-center gap-2 rounded-xl bg-[#17212B] px-4 py-3 text-sm font-semibold text-white hover:bg-[#273542]"
            >
              <Save size={16} />
              Save changes
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#176B61]">
                <Check size={14} />
                Saved
              </span>
            )}
          </div>
        </SettingsCard>

        <SettingsCard
          title="Notifications"
          description="Choose which events you want to be notified about."
        >
          <ToggleRow
            label="Email notifications"
            description="Receive important StayLux account notifications."
            enabled={emailNotifications}
            setEnabled={setEmailNotifications}
          />
          <ToggleRow
            label="New bookings"
            description="Notify me whenever a guest makes a booking."
            enabled={bookingNotifications}
            setEnabled={setBookingNotifications}
          />
          <ToggleRow
            label="New reviews"
            description="Notify me when guests leave reviews."
            enabled={reviewNotifications}
            setEnabled={setReviewNotifications}
          />
        </SettingsCard>
      </div>
    </>
  );
}

/* =========================================================
   HELP
========================================================= */

const faqs = [
  {
    q: "How do I add a new property?",
    a: "Go to Properties and choose Add Property. Fill in the name, location and image, then select Create Property.",
  },
  {
    q: "How do I confirm a pending booking?",
    a: "Open Bookings and use the tick button next to a pending reservation, or change its status from the status menu.",
  },
  {
    q: "Why can't I save or delete a property?",
    a: "Your Supabase hotels table needs Row Level Security policies that allow insert, update and delete for your account.",
  },
];

function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Help & Support"
        description="Get help managing your StayLux properties."
      />

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <SupportCard
          href="mailto:support@staylux.com"
          icon={<Mail size={22} />}
          title="Email Support"
          description="Send our support team a message."
        />
        <SupportCard
          href="tel:+919876543210"
          icon={<Phone size={22} />}
          title="Contact Support"
          description="Speak with the StayLux support team."
        />
      </div>

      <div className="mt-5 rounded-2xl border border-[#E3E8EC] bg-white p-6">
        <h3 className="font-semibold">Frequently asked questions</h3>

        <div className="mt-4 divide-y divide-[#EDF0F2]">
          {faqs.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">
                {item.q}
                <ChevronDown
                  size={16}
                  className="text-[#89939D] transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-xs leading-5 text-[#68737E]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#E5E9EE] bg-[#F8F9FA] px-3.5 py-2.5">
      <Search size={17} className="shrink-0 text-[#8D97A1]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full bg-transparent text-sm outline-none placeholder:text-[#9AA3AC]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-xs text-[#89939D]"
        >
          Clear
        </button>
      )}
    </div>
  );
}

/** Shows an image, falls back when the URL is empty or fails (and recovers when the URL changes). */
function PropertyImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

/** Upload from the device (Supabase Storage) or paste an image URL. */
function ImageUploadField({
  label,
  value,
  onChange,
  folder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return setError("Please choose an image file (JPG, PNG or WebP).");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return setError("Image must be smaller than 5 MB.");
    }

    setUploading(true);
    setError("");

    try {
      onChange(await uploadImage(file, folder));
    } catch (err) {
      console.warn("Image upload error:", describeError(err));
      setError(errMsg(err, "Image could not be uploaded."));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl border border-[#E3E8EC] bg-white px-3.5 py-3 text-sm font-semibold hover:bg-[#F7F9FA] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#176B61]/30 border-t-[#176B61]" />
          ) : (
            <Upload size={16} />
          )}
          {uploading ? "Uploading..." : "Upload from device"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />

        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-[#E3E8EC] px-3 py-2.5">
          <ImageIcon size={17} className="shrink-0 text-[#89939D]" />
          <input
            value={value}
            onChange={(event) => {
              setError("");
              onChange(event.target.value);
            }}
            placeholder="or paste an image URL"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {value.trim() && (
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#E3E8EC] bg-[#F7F9FA]">
          <PropertyImage
            src={value.trim()}
            alt={`${label} preview`}
            className="h-44 w-full object-cover"
            fallback={
              <div className="flex h-44 items-center justify-center px-4 text-center text-xs text-[#89939D]">
                This image could not be loaded. Check the URL.
              </div>
            }
          />
          <button
            type="button"
            aria-label="Remove image"
            onClick={() => onChange("")}
            className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/75"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Predefined amenities with check / uncheck, plus custom ones. */
function AmenitiesPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [custom, setCustom] = useState("");

  const options = [
    ...AMENITY_OPTIONS,
    ...selected.filter((item) => !AMENITY_OPTIONS.includes(item)),
  ];

  function toggle(item: string) {
    onChange(
      selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item]
    );
  }

  function addCustom() {
    const value = custom.trim();
    if (!value) return;

    const existing = options.find(
      (item) => item.toLowerCase() === value.toLowerCase()
    );
    const name = existing ?? value;

    if (!selected.includes(name)) onChange([...selected, name]);
    setCustom("");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Amenities{" "}
          <span className="text-xs font-normal text-[#89939D]">
            ({selected.length} selected)
          </span>
        </label>

        <div className="flex gap-3 text-xs font-semibold text-[#176B61]">
          <button type="button" onClick={() => onChange(options)}>
            Select all
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[#89939D]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((item) => {
          const checked = selected.includes(item);

          return (
            <label
              key={item}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                checked
                  ? "border-[#176B61] bg-[#EAF2F1] text-[#176B61]"
                  : "border-[#E3E8EC] text-[#56616C] hover:bg-[#F7F9FA]"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(item)}
                className="h-4 w-4 shrink-0 accent-[#176B61]"
              />
              {item}
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add a custom amenity"
          className="w-full rounded-xl border border-[#E3E8EC] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#176B61]"
        />
        <button
          type="button"
          onClick={addCustom}
          className="shrink-0 rounded-xl border border-[#E3E8EC] px-4 text-sm font-semibold hover:bg-[#F7F9FA]"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-medium text-[#176B61]">{eyebrow}</p>
        <h2 className="mt-1.5 text-[30px] font-semibold tracking-[-0.03em]">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-[#7D8791]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  change,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E3E8EC] bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2F1] text-[#176B61]">
          {icon}
        </div>
        {change && (
          <span className="rounded-full bg-[#EAF4F0] px-2.5 py-1 text-[10px] font-semibold text-[#176B61]">
            {change}
          </span>
        )}
      </div>

      <p className="mt-5 text-xs font-medium text-[#89939D]">{label}</p>
      <p className="mt-1 text-[23px] font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function RevenueCard({
  totalRevenue,
  bookings,
}: {
  totalRevenue: number;
  bookings: Booking[];
}) {
  /* one bar per confirmed / completed booking, scaled to the biggest one */
  const paid = bookings.filter(isRevenueBooking).slice(-12);
  const max = Math.max(...paid.map((b) => b.amount), 1);

  return (
    <div className="rounded-2xl border border-[#E3E8EC] bg-white p-6">
      <p className="text-sm font-medium text-[#7D8791]">Revenue Overview</p>

      <h3 className="mt-1 text-2xl font-semibold">{money(totalRevenue)}</h3>

      <p className="mt-1 text-xs text-[#9AA3AC]">
        Revenue per booking (confirmed and completed)
      </p>

      {paid.length === 0 ? (
        <p className="mt-8 flex h-[230px] items-center justify-center rounded-xl bg-[#F7F9FA] text-xs text-[#89939D]">
          No confirmed bookings yet.
        </p>
      ) : (
        <>
          <div className="mt-8 flex h-[230px] items-end gap-2 sm:gap-3">
            {paid.map((booking) => (
              <div
                key={booking.id}
                title={`${booking.id} · ${money(booking.amount)}`}
                className="group flex h-full flex-1 items-end"
              >
                <div
                  style={{
                    height: `${Math.max(8, (booking.amount / max) * 100)}%`,
                  }}
                  className="w-full rounded-t-lg bg-[#D8E9E6] transition group-hover:bg-[#176B61]"
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between text-[10px] text-[#A0A8B0]">
            <span>{paid[0].id}</span>
            <span>{paid[paid.length - 1].id}</span>
          </div>
        </>
      )}
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <tr className="border-b border-[#EDF0F2] last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF2F3] text-[10px] font-semibold text-[#53616B]">
            {initials(booking.guest)}
          </div>
          <span className="text-xs font-semibold">{booking.guest}</span>
        </div>
      </td>

      <td className="px-6 py-4 text-xs text-[#68737E]">{booking.property}</td>

      <td className="px-6 py-4 text-xs text-[#68737E]">
        {booking.checkIn} — {booking.checkOut}
      </td>

      <td className="px-6 py-4 text-xs font-semibold">
        {money(booking.amount)}
      </td>

      <td className="px-6 py-4">
        <StatusBadge status={booking.status} />
      </td>
    </tr>
  );
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "completed":
    case "available":
    case "active":
      return "bg-[#EAF4F0] text-[#176B61]";
    case "pending":
    case "occupied":
      return "bg-[#FFF6DF] text-[#9A741D]";
    case "cancelled":
    case "maintenance":
      return "bg-red-50 text-red-500";
    default:
      return "bg-[#F3F5F6] text-[#68737E]";
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass(status)}`}
    >
      {status}
    </span>
  );
}

function StatusSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      aria-label="Change status"
      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-[10px] font-semibold outline-none ${statusClass(value)}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F7F9FA] p-3">
      <p className="text-xs text-[#89939D]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-[#E3E8EC] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#176B61] focus:ring-2 focus:ring-[#176B61]/10"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full resize-none rounded-xl border border-[#E3E8EC] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#176B61] focus:ring-2 focus:ring-[#176B61]/10"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-[#E3E8EC] bg-white px-3.5 py-3 text-sm outline-none focus:border-[#176B61]"
      >
        {options.length === 0 ? (
          <option value="">No options available</option>
        ) : (
          options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  /* Escape closes the modal, and the page behind it stops scrolling */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#E8ECEF] bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-[#89939D]">{description}</p>
          </div>

          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-xl p-2 text-[#7D8791] hover:bg-[#F3F5F7]"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Notification({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-[#F7F9FA] p-3">
      <p className="text-xs font-semibold">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-[#89939D]">{description}</p>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E3E8EC] bg-white p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-[#89939D]">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  setEnabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EDF0F2] py-4 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-[#89939D]">{description}</p>
      </div>

      <button
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={() => setEnabled(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-[#176B61]" : "bg-[#D7DDE1]"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function SupportCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl border border-[#E3E8EC] bg-white p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2F1] text-[#176B61]">
        {icon}
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#89939D]">{description}</p>
    </a>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-7 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DCE2E6] bg-white px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF2F1] text-[#176B61]">
        {icon}
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#89939D]">
        {description}
      </p>
    </div>
  );
}