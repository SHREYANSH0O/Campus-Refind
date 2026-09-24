import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Calendar,
  CheckCircle2,
  PackagePlus,
  ShieldCheck,
  ArrowUpDown,
  Tag,
  Clock,
  Building,
  X,
  RotateCcw,
  Laptop,
  BookOpen,
  Key,
  CreditCard,
  Wallet,
  Shirt,
  Dumbbell,
  Watch,
  Layers,
  Grid,
  List as ListIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ItemTicket, TicketType, TicketStatus, ItemCategory } from "../types";
import { CAMPUS_LOCATIONS, CAMPUS_BUILDINGS } from "../data/mockData";

interface BrowseReportsViewProps {
  tickets: ItemTicket[];
  onSelectItem: (ticket: ItemTicket) => void;
  onOpenReport: (defaultType?: "lost" | "found") => void;
}

const CATEGORIES: { name: ItemCategory; icon: React.FC<{ className?: string }> }[] = [
  { name: "Electronics", icon: Laptop },
  { name: "Books & Stationery", icon: BookOpen },
  { name: "IDs & Cards", icon: CreditCard },
  { name: "Keys", icon: Key },
  { name: "Wallets & Bags", icon: Wallet },
  { name: "Clothing & Accessories", icon: Shirt },
  { name: "Sports & Fitness", icon: Dumbbell },
  { name: "Watches & Jewelry", icon: Watch },
  { name: "Other", icon: Tag },
];

type DatePreset = "all" | "today" | "3days" | "7days" | "30days" | "custom";
type SortOption = "date_desc" | "date_asc" | "title_asc" | "claims_desc";

export const BrowseReportsView: React.FC<BrowseReportsViewProps> = ({
  tickets,
  onSelectItem,
  onOpenReport,
}) => {
  // Search & Type
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "lost" | "found">("all");

  // Advanced Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("all");
  const [specificAreaQuery, setSpecificAreaQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Date Range Filtering
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Sort & View Layout
  const [sortBy, setSortBy] = useState<SortOption>("date_desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      counts[c.name] = tickets.filter((t) => t.category === c.name).length;
    });
    return counts;
  }, [tickets]);

  // Compute active filters count (excluding search & type)
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedBuilding !== "all") count++;
    if (specificAreaQuery.trim()) count++;
    if (selectedStatus !== "all") count++;
    if (datePreset !== "all") count++;
    return count;
  }, [selectedCategory, selectedBuilding, specificAreaQuery, selectedStatus, datePreset]);

  // Helper to parse date string YYYY-MM-DD
  const parseTicketDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Filter & Sort Logic
  const filteredTickets = useMemo(() => {
    const today = new Date(2026, 8, 21); // Aligned with app timestamp (2026-09-21)
    today.setHours(23, 59, 59, 999);

    let result = tickets.filter((ticket) => {
      // 1. Full-text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ticket.title.toLowerCase().includes(q);
        const matchesLocation = ticket.location.toLowerCase().includes(q);
        const matchesArea = ticket.specificArea?.toLowerCase().includes(q) || false;
        const matchesDesc = ticket.description.toLowerCase().includes(q);
        const matchesNum = ticket.ticketNumber.toLowerCase().includes(q);
        const matchesReporter = ticket.reporterName.toLowerCase().includes(q);
        const matchesCat = ticket.category.toLowerCase().includes(q);

        if (
          !matchesTitle &&
          !matchesLocation &&
          !matchesArea &&
          !matchesDesc &&
          !matchesNum &&
          !matchesReporter &&
          !matchesCat
        ) {
          return false;
        }
      }

      // 2. Type Filter (Lost vs Found)
      if (selectedType !== "all" && ticket.type !== selectedType) {
        return false;
      }

      // 3. Category Filter
      if (selectedCategory !== "all" && ticket.category !== selectedCategory) {
        return false;
      }

      // 4. Building Location Filter
      if (selectedBuilding !== "all") {
        const matchesBuilding = ticket.location
          .toLowerCase()
          .includes(selectedBuilding.toLowerCase());
        if (!matchesBuilding) return false;
      }

      // 5. Specific Area/Room keyword
      if (specificAreaQuery.trim()) {
        const areaQ = specificAreaQuery.toLowerCase();
        const inSpecificArea = ticket.specificArea?.toLowerCase().includes(areaQ) || false;
        const inLocation = ticket.location.toLowerCase().includes(areaQ);
        if (!inSpecificArea && !inLocation) return false;
      }

      // 6. Status Filter
      if (selectedStatus !== "all" && ticket.status !== selectedStatus) {
        return false;
      }

      // 7. Date Range Filter
      const ticketDate = parseTicketDate(ticket.date);
      if (ticketDate) {
        if (datePreset === "today") {
          // Compare YYYY-MM-DD
          const isToday =
            ticketDate.getFullYear() === today.getFullYear() &&
            ticketDate.getMonth() === today.getMonth() &&
            ticketDate.getDate() === today.getDate();
          if (!isToday) return false;
        } else if (datePreset === "3days") {
          const threeDaysAgo = new Date(today);
          threeDaysAgo.setDate(today.getDate() - 3);
          threeDaysAgo.setHours(0, 0, 0, 0);
          if (ticketDate < threeDaysAgo) return false;
        } else if (datePreset === "7days") {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          if (ticketDate < sevenDaysAgo) return false;
        } else if (datePreset === "30days") {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(today.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          if (ticketDate < thirtyDaysAgo) return false;
        } else if (datePreset === "custom") {
          if (customStartDate) {
            const start = parseTicketDate(customStartDate);
            if (start) {
              start.setHours(0, 0, 0, 0);
              if (ticketDate < start) return false;
            }
          }
          if (customEndDate) {
            const end = parseTicketDate(customEndDate);
            if (end) {
              end.setHours(23, 59, 59, 999);
              if (ticketDate > end) return false;
            }
          }
        }
      }

      return true;
    });

    // Sort result
    return result.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime();
      }
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "claims_desc") {
        return (b.claimCount ?? b.claims.length) - (a.claimCount ?? a.claims.length);
      }
      return 0;
    });
  }, [
    tickets,
    searchQuery,
    selectedType,
    selectedCategory,
    selectedBuilding,
    specificAreaQuery,
    selectedStatus,
    datePreset,
    customStartDate,
    customEndDate,
    sortBy,
  ]);

  // Reset all filters helper
  const handleResetAllFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedCategory("all");
    setSelectedBuilding("all");
    setSpecificAreaQuery("");
    setSelectedStatus("all");
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSortBy("date_desc");
  };

  const hasAnyFilterActive =
    searchQuery.trim() !== "" ||
    selectedType !== "all" ||
    selectedCategory !== "all" ||
    selectedBuilding !== "all" ||
    specificAreaQuery.trim() !== "" ||
    selectedStatus !== "all" ||
    datePreset !== "all";

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Browse Campus Reports</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {filteredTickets.length} items
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search and filter lost belongings and found items by category, building, date range, or status
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenReport("lost")}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <PackagePlus className="w-4 h-4" />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Category Quick Selector Chips Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter by Category</span>
          </span>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className="text-[11px] text-blue-600 hover:underline font-semibold"
            >
              Reset category
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>All Categories</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === "all" ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-600"
              }`}
            >
              {tickets.length}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.name] || 0;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                type="button"
                key={cat.name}
                onClick={() => setSelectedCategory(isSelected ? "all" : cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-blue-700 text-blue-100" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Main Search Row */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="report-search"
              name="report-search"
              aria-label="Search campus reports"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name, room, description, or ticket number..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear report search"
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Toggle Pills (All / Lost / Found) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0" role="group" aria-label="Report type filter">
            <button
              type="button"
              onClick={() => setSelectedType("all")}
              aria-pressed={selectedType === "all"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedType === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("lost")}
              aria-pressed={selectedType === "lost"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedType === "lost"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-rose-600"
              }`}
            >
              Lost Only
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("found")}
              aria-pressed={selectedType === "found"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedType === "found"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-emerald-600"
              }`}
            >
              Found Only
            </button>
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            aria-expanded={isAdvancedOpen}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 shrink-0 ${
              isAdvancedOpen || activeAdvancedCount > 0
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Advanced Filters</span>
            {activeAdvancedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeAdvancedCount}
              </span>
            )}
            {isAdvancedOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Expandable Advanced Filter Panel */}
        {isAdvancedOpen && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Building Location Selector */}
              <div className="space-y-1.5">
                <label htmlFor="filter-building" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Campus Building</span>
                </label>
                <select
                  id="filter-building"
                  name="filter-building"
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-slate-800 font-medium"
                >
                  <option value="all">All Campus Buildings</option>
                  {CAMPUS_BUILDINGS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Specific Area / Room Input */}
              <div className="space-y-1.5">
                <label htmlFor="filter-specific-area" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Room / Specific Area</span>
                </label>
                <input
                  id="filter-specific-area"
                  name="filter-specific-area"
                  type="text"
                  value={specificAreaQuery}
                  onChange={(e) => setSpecificAreaQuery(e.target.value)}
                  placeholder="e.g. 2nd floor, cubicle, booth..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-slate-800"
                />
              </div>

              {/* 3. Status Filter */}
              <div className="space-y-1.5">
                <label htmlFor="filter-status" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Resolution Status</span>
                </label>
                <select
                  id="filter-status"
                  name="filter-status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-slate-800 font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open (Available for Claim)</option>
                  <option value="under_verification">Under Verification</option>
                  <option value="returned_closed">Returned & Successfully Closed</option>
                </select>
              </div>

              {/* 4. Sort Order */}
              <div className="space-y-1.5">
                <label htmlFor="filter-sort" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sort Order</span>
                </label>
                <select
                  id="filter-sort"
                  name="filter-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white text-slate-800 font-medium"
                >
                  <option value="date_desc">Newest Reported First</option>
                  <option value="date_asc">Oldest Reported First</option>
                  <option value="title_asc">Item Title (A to Z)</option>
                  <option value="claims_desc">Most Claims Filed</option>
                </select>
              </div>
            </div>

            {/* Date Range Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Filter by Date Range
                  </span>
                </div>

                {/* Date Presets Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { key: "all", label: "Any Time" },
                      { key: "today", label: "Today" },
                      { key: "3days", label: "Past 3 Days" },
                      { key: "7days", label: "Past 7 Days" },
                      { key: "30days", label: "Past 30 Days" },
                      { key: "custom", label: "Custom Range" },
                    ] as const
                  ).map((preset) => (
                    <button
                      type="button"
                      key={preset.key}
                      onClick={() => setDatePreset(preset.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        datePreset === preset.key
                          ? "bg-blue-600 text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Pickers (Shown when custom is selected or if dates are input) */}
              {datePreset === "custom" && (
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                  <div>
                    <label htmlFor="filter-date-start" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      From Date
                    </label>
                    <input
                      id="filter-date-start"
                      name="filter-date-start"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-date-end" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      To Date
                    </label>
                    <input
                      id="filter-date-end"
                      name="filter-date-end"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Tags Bar */}
      {hasAnyFilterActive && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900">
          <span className="font-bold text-[11px] text-blue-800 uppercase tracking-wider mr-1">
            Active Filters:
          </span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs text-slate-800">
              <span>Query: &ldquo;{searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Remove search filter"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedType !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs text-slate-800">
              <span className="capitalize">{selectedType} Items</span>
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                aria-label="Remove report type filter"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedCategory !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs text-slate-800">
              <span>Category: {selectedCategory}</span>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                aria-label="Remove category filter"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBuilding !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs text-slate-800">
              <span>Building: {selectedBuilding}</span>
              <button
                type="button"
                onClick={() => setSelectedBuilding("all")}
                aria-label="Remove building filter"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {specificAreaQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs text-slate-800">
              <span>Area: &ldquo;{specificAreaQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => setSpecificAreaQuery("")}
                aria-label="Remove area filter"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {datePreset !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs text-slate-800">
              <span>
                Date:{" "}
                {datePreset === "custom"
                  ? `${customStartDate || "start"} to ${customEndDate || "now"}`
                  : datePreset === "today"
                  ? "Today"
                  : datePreset === "3days"
                  ? "Past 3 Days"
                  : datePreset === "7days"
                  ? "Past 7 Days"
                  : "Past 30 Days"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setDatePreset("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedStatus !== "all" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-blue-200 shadow-2xs text-slate-800">
              <span>
                Status:{" "}
                {selectedStatus === "open"
                  ? "Open"
                  : selectedStatus === "under_verification"
                  ? "Under Verification"
                  : "Returned & Closed"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedStatus("all")}
                aria-label="Remove status filter"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetAllFilters}
            className="ml-auto text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Results Header: Count & View Switcher */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <strong>{filteredTickets.length}</strong> of <strong>{tickets.length}</strong> campus reports
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              aria-label="Show reports as a grid"
              aria-pressed={viewMode === "grid"}
              className={`p-1.5 rounded-md transition ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="Show reports as a list"
              aria-pressed={viewMode === "list"}
              className={`p-1.5 rounded-md transition ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Display */}
      {filteredTickets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            {tickets.length === 0 ? <PackagePlus className="w-7 h-7 text-blue-600" /> : <Search className="w-7 h-7" />}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-slate-900 text-base">
              {tickets.length === 0 ? "No Campus Reports Registered Yet" : "No Matching Campus Reports"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {tickets.length === 0
                ? "All pre-reported items have been cleared. Reports will appear dynamically as students, staff, and faculty submit real lost & found items."
                : `No lost or found items matched your current filters${
                    selectedCategory !== "all" ? ` for "${selectedCategory}"` : ""
                  }${selectedBuilding !== "all" ? ` at "${selectedBuilding}"` : ""}${
                    datePreset !== "all" ? ` within the selected date range` : ""
                  }.`}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {tickets.length > 0 && hasAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Filters</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenReport("lost")}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Report Lost Item</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenReport("found")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Report Found Item</span>
            </button>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTickets.map((ticket) => {
            const isClosed = ticket.status === "returned_closed";
            const isPending = ticket.status === "under_verification";

            return (
              <div
                key={ticket.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${ticket.title}, ticket ${ticket.ticketNumber}`}
                onClick={() => onSelectItem(ticket)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectItem(ticket);
                  }
                }}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 p-4 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3.5">
                    <img
                      src={ticket.imageUrl}
                      alt={ticket.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />

                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          ticket.type === "lost"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-emerald-600 text-white shadow-xs"
                        }`}
                      >
                        {ticket.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-xs">
                        {ticket.category}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/90 text-slate-800 backdrop-blur-xs border border-slate-200/60 shadow-xs">
                        #{ticket.ticketNumber}
                      </span>
                    </div>

                    {isClosed && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Returned & Closed</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                    {ticket.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {ticket.description}
                  </p>

                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate font-medium text-slate-700">
                        {ticket.location}
                      </span>
                    </div>
                    {ticket.specificArea && (
                      <div className="text-[11px] text-slate-500 pl-5 truncate">
                        Spot: {ticket.specificArea}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{ticket.date}</span>
                      </span>
                      <span>By {ticket.reporterName}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    {isClosed ? (
                      <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Closed</span>
                      </span>
                    ) : isPending ? (
                      <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{(ticket.claimCount ?? ticket.claims.length)} claim(s)</span>
                      </span>
                    ) : (
                      <span className="text-blue-600 font-semibold text-[11px]">
                        Open for claim
                      </span>
                    )}
                  </div>

                  <span className="px-2.5 py-1 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-lg text-slate-700 font-bold text-[11px] transition">
                    View Details
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 shadow-xs">
          {filteredTickets.map((ticket) => {
            const isClosed = ticket.status === "returned_closed";
            const isPending = ticket.status === "under_verification";

            return (
              <div
                key={ticket.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${ticket.title}, ticket ${ticket.ticketNumber}`}
                onClick={() => onSelectItem(ticket)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectItem(ticket);
                  }
                }}
                className="p-4 sm:p-5 hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                    <img
                      src={ticket.imageUrl}
                      alt={ticket.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      referrerPolicy="no-referrer"
                    />
                    {isClosed && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                          ticket.type === "lost"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {ticket.type}
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.2 rounded">
                        #{ticket.ticketNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {ticket.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition truncate">
                      {ticket.title}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{ticket.location}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ticket.date}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {isClosed ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Returned & Closed
                    </span>
                  ) : isPending ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {(ticket.claimCount ?? ticket.claims.length)} claim(s)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      Open
                    </span>
                  )}

                  <button type="button" className="px-3.5 py-1.5 bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
