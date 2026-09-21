import React, { useState } from "react";
import { X, ShieldCheck, CheckCircle2, AlertCircle, FileText, Phone, Sparkles } from "lucide-react";
import { ItemTicket, CampusUser } from "../types";

interface ClaimItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ItemTicket;
  currentUser: CampusUser;
  onSubmitClaim: (ticketId: string, proofDetails: string, contactNumber: string) => void;
}

export const ClaimItemModal: React.FC<ClaimItemModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentUser,
  onSubmitClaim,
}) => {
  const [proofDetails, setProofDetails] = useState("");
  const [contactNumber, setContactNumber] = useState("+1 (555) 019-8822");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDetails.trim() || !agreedTerms) return;

    onSubmitClaim(ticket.id, proofDetails, contactNumber);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Claim Verification Request
              </h3>
              <p className="text-xs text-slate-500">
                Ticket #{ticket.ticketNumber} • {ticket.title}
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

        {submitted ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Claim Successfully Submitted!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your proof of ownership has been forwarded to the reporter and Campus Security Desk for verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs text-blue-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-blue-900">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Verification Requirement</span>
              </div>
              <p>
                To prevent fraudulent claims, please provide specific identifiable information only the true owner would know (e.g., internal pouch contents, serial number, lockscreen image, scratch locations, or purchase receipt).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Proof of Ownership / Identifying Details *
              </label>
              <textarea
                required
                rows={4}
                value={proofDetails}
                onChange={(e) => setProofDetails(e.target.value)}
                placeholder="Describe secret marks, engraving, lockscreen wallpaper, stickers, or contents inside..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-slate-900 text-xs sm:text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Claimant Name
                </label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
                  {currentUser.name} ({currentUser.role})
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I certify that I am the legal owner of this item under University Code of Conduct, and agree to present my valid Campus ID at handover.
                </span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!proofDetails.trim() || !agreedTerms}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Submit Claim for Verification
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
