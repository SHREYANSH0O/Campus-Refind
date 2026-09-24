import React, { useMemo, useState } from "react";
import { LifeBuoy, CheckCircle2, Clock3 } from "lucide-react";
import {
  CampusUser,
  SupportIssueType,
  SupportRequest,
} from "../types";

interface SupportViewProps {
  currentUser: CampusUser;
  requests: SupportRequest[];
  onSubmit: (
    issueType: SupportIssueType,
    subject: string,
    description: string
  ) => Promise<void>;
}

const issueOptions: SupportIssueType[] = [
  "Technical Bug",
  "Account Problem",
  "Report / Claim Issue",
  "Suspicious User",
  "Privacy Concern",
  "Other",
];

export const SupportView: React.FC<SupportViewProps> = ({
  currentUser,
  requests,
  onSubmit,
}) => {
  const [issueType, setIssueType] = useState<SupportIssueType>("Technical Bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const ownRequests = useMemo(
    () => requests.filter((request) => request.userId === currentUser.id),
    [requests, currentUser.id]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim() || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitted(false);

    try {
      await onSubmit(issueType, subject.trim(), description.trim());
      setSubject("");
      setDescription("");
      setIssueType("Technical Bug");
      setSubmitted(true);
      window.setTimeout(() => setSubmitted(false), 2500);
    } catch (error) {
      console.error("Support request submission failed:", error);
      setSubmitError(
        "Concern could not be submitted. Please try again. If this continues, the latest Firestore rules may not be deployed."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Help &amp; Support</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Report portal bugs, account problems, privacy concerns, suspicious activity,
              or issues with a report. Portal Admin handles platform concerns only and does
              not decide item ownership.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div>
            <h2 className="font-black text-slate-900">Submit a concern</h2>
            <p className="text-xs text-slate-500 mt-1">
              Give enough detail so the portal team can understand the issue.
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Issue type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as SupportIssueType)}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500"
            >
              {issueOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              placeholder="Short summary of the problem"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              maxLength={1500}
              placeholder="What happened? What were you trying to do?"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {submitted && (
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              Your concern has been submitted to Portal Admin.
            </div>
          )}

          {submitError && (
            <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!subject.trim() || !description.trim() || isSubmitting}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-bold transition"
          >
            {isSubmitting ? "Submitting..." : "Submit Concern"}
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-black text-slate-900">Your requests</h2>
              <p className="text-xs text-slate-500 mt-1">
                Track the latest status and admin response.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {ownRequests.length} total
            </span>
          </div>

          <div className="space-y-3">
            {ownRequests.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                You have not submitted any support requests yet.
              </div>
            ) : (
              ownRequests.map((request) => (
                <div key={request.id} className="border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                        {request.issueType}
                      </div>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {request.subject}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        request.status === "resolved"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {request.status === "in_progress"
                        ? "In Progress"
                        : request.status === "resolved"
                        ? "Resolved"
                        : "Open"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {request.description}
                  </p>

                  {request.adminReply && (
                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        Portal Admin reply
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{request.adminReply}</p>
                    </div>
                  )}

                  <div className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
                    {request.status === "resolved" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Clock3 className="w-3 h-3" />
                    )}
                    {new Date(request.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
