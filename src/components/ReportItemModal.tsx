import React, { useState } from "react";
import {
  X,
  PackagePlus,
  MapPin,
  Calendar,
  Clock,
  HelpCircle,
  Upload,
  CheckCircle2,
  Sparkles,
  Lock,
} from "lucide-react";
import { TicketType, ItemCategory, CampusUser } from "../types";
import { CAMPUS_LOCATIONS } from "../data/mockData";

interface ReportItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CampusUser;
  onAddTicket: (newTicketData: any) => void;
  defaultType?: TicketType;
}

const CATEGORIES: ItemCategory[] = [
  "Electronics",
  "IDs & Cards",
  "Keys",
  "Wallets & Bags",
  "Books & Stationery",
  "Clothing & Accessories",
  "Sports & Fitness",
  "Watches & Jewelry",
  "Other",
];

const PRESET_IMAGES: Record<ItemCategory, string> = {
  Electronics: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  "IDs & Cards": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
  Keys: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80",
  "Wallets & Bags": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
  "Books & Stationery": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
  "Clothing & Accessories": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
  "Sports & Fitness": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
  "Watches & Jewelry": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  Other: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
};

export const ReportItemModal: React.FC<ReportItemModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAddTicket,
  defaultType = "lost",
}) => {
  const [ticketType, setTicketType] = useState<TicketType>(defaultType);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Electronics");
  const [location, setLocation] = useState(CAMPUS_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState("");
  const [specificArea, setSpecificArea] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("12:00");
  const [description, setDescription] = useState("");
  const [secretIdentifiers, setSecretIdentifiers] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalLocation = customLocation.trim() ? customLocation.trim() : location;
    const finalImage = PRESET_IMAGES[category] || "";

    onAddTicket({
      type: ticketType,
      title: title.trim(),
      category,
      location: finalLocation,
      specificArea: specificArea.trim(),
      date,
      time,
      description: description.trim(),
      secretIdentifiers: secretIdentifiers.trim(),
      imageUrl: finalImage,
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setSecretIdentifiers("");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Raise Campus Ticket
              </h3>
              <p className="text-xs text-slate-500">
                Log a lost belonging or report a found item on campus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">
              Ticket Successfully Published!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your {ticketType} item ticket is now live in the campus registry. You will receive notifications when claims or updates are logged.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
            {/* Type Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                What are you reporting? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTicketType("lost")}
                  className={`py-3 px-4 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    ticketType === "lost"
                      ? "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-200"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm">I Lost an Item</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Notify campus members to look out for it
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType("found")}
                  className={`py-3 px-4 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    ticketType === "found"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-200"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm">I Found an Item</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Help reunite it with its rightful owner
                  </span>
                </button>
              </div>
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Item Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. TI-84 Plus CE Calculator, Blue Hydro Flask"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ItemCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campus Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Campus Location (Where {ticketType === "lost" ? "lost" : "found"}) *
              </label>
              <div className="space-y-2">
                <select
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setCustomLocation("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm bg-white"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                  <option value="custom">Other / Custom Location...</option>
                </select>

                {location === "custom" && (
                  <input
                    type="text"
                    required
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Enter specific campus building, hall, or outdoor area..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm"
                  />
                )}

                <input
                  type="text"
                  value={specificArea}
                  onChange={(e) => setSpecificArea(e.target.value)}
                  placeholder="Specific room, bench, or desk (e.g. 2nd floor cubicle #14, near water fountain)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date {ticketType === "lost" ? "Lost" : "Found"} *</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Approximate Time</span>
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Public Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Public Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe color, general brand, appearance, and context of where it was placed..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm leading-relaxed"
              />
            </div>

            {/* Secret Identifiers / Private Verification Details */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Secret Identifiers (Private Verification Criteria)</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Enter private details kept hidden from the public that a claimant must provide to prove rightful ownership (e.g. lockscreen photo, specific stickers, serial number, or internal pouch contents).
              </p>
              <input
                type="text"
                value={secretIdentifiers}
                onChange={(e) => setSecretIdentifiers(e.target.value)}
                placeholder="e.g. Octocat sticker, wallpaper of dog, serial ends in 98X4"
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none text-slate-900 text-xs"
              />
            </div>

            {/* Reporter Info Preview */}
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <span>Posting as: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role} • {currentUser.campusId})</span>
              <span className="text-blue-600 font-medium">Verified Campus ID</span>
            </div>

            {/* Form Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Publish {ticketType === "lost" ? "Lost" : "Found"} Ticket
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
