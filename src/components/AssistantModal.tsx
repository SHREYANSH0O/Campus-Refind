import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Bot,
  Sparkles,
  Send,
  FileText,
  ShieldCheck,
  Clock,
  MapPin,
  Search,
  MessageSquare,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ItemTicket } from "../types";

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  currentTickets: ItemTicket[];
}

interface MessageItem {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  isQuickTopics?: boolean;
}

export const AssistantModal: React.FC<AssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  currentTickets,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "initial-1",
      sender: "bot",
      text: "Hi! I'm your Campus ReFind assistant. I can help you with reporting lost/found items, claims, account issues, and more.\nWhat can I help you with today?",
      timestamp: "06:37 PM",
    },
    {
      id: "initial-2",
      sender: "user",
      text: "What can I help you with?",
      timestamp: "06:37 PM",
    },
    {
      id: "initial-3",
      sender: "bot",
      text: "Here are some common topics. You can tap an option below or type your own question.",
      timestamp: "06:37 PM",
      isQuickTopics: true,
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const nowTimeStr = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSendMessage = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || isLoading) return;

    const userTime = nowTimeStr();
    const newUserMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: userTime,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      // Build conversation history for server-side Gemini
      // Filter out initial introductory widgets and keep conversational turns
      const historyPayload = messages
        .filter((m) => !m.isQuickTopics && m.id !== "initial-1" && m.id !== "initial-3")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          text: m.text,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
          contextItems: currentTickets,
        }),
      });

      let botReply = "";
      if (res.ok) {
        const data = await res.json();
        botReply = data.reply;
      }

      if (!botReply) {
        botReply = getClientKnowledgeReply(trimmed, currentTickets);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: botReply,
          timestamp: nowTimeStr(),
        },
      ]);
    } catch (err) {
      // Contextual, question-specific fallback if network fails
      const fallbackReply = getClientKnowledgeReply(trimmed, currentTickets);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: fallbackReply,
          timestamp: nowTimeStr(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Client-side campus knowledge resolver for offline or network-resilient guidance
   */
  const getClientKnowledgeReply = (query: string, tickets: ItemTicket[] = []): string => {
    const q = query.toLowerCase().trim();

    if (
      q.includes("collect") ||
      (q.includes("where") && (q.includes("item") || q.includes("approved") || q.includes("desk") || q.includes("pick") || q.includes("office"))) ||
      q.includes("pickup") ||
      q.includes("pick up")
    ) {
      return `🤝 How to Complete an Approved Handover:

• Coordinate a safe meeting point on campus with the report creator.
• Bring your Campus Student / Faculty ID if the reporter asks for identity confirmation.
• Show your Handover Code from "My claims" (for example REFIND-XXXX).
• Compare the item only at the time of handover; never post private verification details publicly.
• Once the item is physically handed over, the report creator confirms the return and closes the report.

Portal Admin handles technical/support concerns and does not decide ownership.`;
    }

    if (
      q.includes("claim status") ||
      q.includes("check my claim") ||
      q.includes("status of my claim") ||
      q.includes("track my claim") ||
      (q.includes("how") && q.includes("status"))
    ) {
      return `🔍 How to Check Your Claim Status:

1. Click on "My claims" in the left-hand navigation sidebar.
2. Here you will see all your claims and their current stages:
  • Under Verification: The report creator is checking your proof of ownership.
  • Approved - Ready for Handover: Your claim has been verified! A 6-digit REFIND code is generated for you.
  • Returned & Closed: The item was handed over and the report was closed.
  • Rejected: Details did not match; you can provide more details.

Tip: You will also receive an instant in-app notification when the status changes!`;
    }

    if (
      (q.includes("what happens") || q.includes("after")) &&
      q.includes("claim")
    ) {
      return `⏱️ What Happens After You Submit a Claim:

1. Verification Review:
   The report creator compares your submitted proof against the item's private verification notes (such as secret scratches, wallpaper, or serial number).

2. Approval & Handover Code:
   Once confirmed, an approval notification is sent and a unique 6-digit handover code (e.g. REFIND-8841) is issued under "My claims".

3. Safe Collection:
   Coordinate a safe campus meeting with the report creator, share the handover code, and receive your belonging.`;
    }

    if (
      q.includes("how do i report") ||
      q.includes("how to report") ||
      (q.includes("report") && (q.includes("item") || q.includes("lost") || q.includes("found")))
    ) {
      return `📝 How to Report a Lost or Found Item:

1. Click the "Report an item" button in the sidebar.
2. Select whether you:
   • Lost Something: Enter item name, category, date, and where you last saw it (e.g. Central Library, Canteen, Vivekanand Hall).
   • Found Something: Enter where you found it. Set private verification questions (e.g. lock screen description or specific contents) so only the true owner can claim it.
3. Upload an image if available.
4. Click "Publish Report" to publish the ticket immediately!`;
    }

    if (
      q.includes("how do i claim") ||
      q.includes("how to claim") ||
      q.includes("claim an item")
    ) {
      return `🛡️ How to Claim an Item:

1. Go to "Browse reports" or check the Dashboard.
2. Click on the item card to open its details.
3. Click "Claim this Item".
4. Fill in the ownership verification form with distinguishing details (e.g. stickers, wallpaper, serial number, or exact contents).
5. Submit your claim for private review by the report creator.`;
    }

    // Check matching items in currentTickets
    const keywords = ["airpod", "phone", "iphone", "samsung", "calculator", "key", "wallet", "bottle", "bag", "id card", "watch", "jacket", "book", "glasses", "headphone"];
    const matched = keywords.find((k) => q.includes(k));
    if (matched && tickets.length > 0) {
      const items = tickets.filter(
        (t) =>
          t.title.toLowerCase().includes(matched) ||
          t.category.toLowerCase().includes(matched) ||
          t.description.toLowerCase().includes(matched)
      );
      if (items.length > 0) {
        let msg = `🔎 Found ${items.length} item(s) related to "${matched}" on campus:\n\n`;
        items.slice(0, 3).forEach((item) => {
          msg += `• [${item.type.toUpperCase()}] ${item.title} — Found/Lost at ${item.location} (${item.date}) [Status: ${item.status}]\n`;
        });
        msg += `\nYou can view full photos and file a claim under "Browse reports".`;
        return msg;
      }
    }

    return `Welcome to Campus ReFind! I'm here to answer any campus lost and found questions.
You can ask:
• "Where do I collect an approved item?"
• "How do I check my claim status?"
• "How do I report a lost or found item?"
• "Has anyone found my AirPods or keys?"
• Or tap any suggested topic above to get started!`;
  };

  const handleTopicClick = (topicText: string) => {
    handleSendMessage(topicText);
  };

  const resetChat = () => {
    setMessages([
      {
        id: "initial-1",
        sender: "bot",
        text: "Hi! I'm your Campus ReFind assistant. I can help you with reporting lost/found items, claims, account issues, and more.\nWhat can I help you with today?",
        timestamp: nowTimeStr(),
      },
      {
        id: "initial-2",
        sender: "user",
        text: "What can I help you with?",
        timestamp: nowTimeStr(),
      },
      {
        id: "initial-3",
        sender: "bot",
        text: "Here are some common topics. You can tap an option below or type your own question.",
        timestamp: nowTimeStr(),
        isQuickTopics: true,
      },
    ]);
  };

  const faqTopics = [
    {
      id: "report-item",
      title: "How do I report a lost or found item?",
      icon: FileText,
      iconBg: "bg-blue-50 text-blue-600",
      query: "How do I report a lost or found item?",
    },
    {
      id: "claim-item",
      title: "How do I claim an item?",
      icon: ShieldCheck,
      iconBg: "bg-emerald-50 text-emerald-600",
      query: "How do I claim an item?",
    },
    {
      id: "claim-submitted",
      title: "What happens after I submit a claim?",
      icon: Clock,
      iconBg: "bg-amber-50 text-amber-600",
      query: "What happens after I submit a claim?",
    },
    {
      id: "collect-location",
      title: "Where do I collect an approved item?",
      icon: MapPin,
      iconBg: "bg-purple-50 text-purple-600",
      query: "Where do I collect an approved item?",
    },
    {
      id: "check-status",
      title: "How do I check my claim status?",
      icon: Search,
      iconBg: "bg-rose-50 text-rose-600",
      query: "How do I check my claim status?",
    },
    {
      id: "something-else",
      title: "Something else",
      icon: MessageSquare,
      iconBg: "bg-slate-100 text-slate-600",
      query: "What other campus services and safety policies does Campus ReFind provide?",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="assistant-modal-container"
        className="bg-white w-full max-w-[540px] h-[85vh] max-h-[780px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-100/90 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-tight">
                Campus ReFind Assistant
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Ask me anything or choose a topic below.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetChat}
              aria-label="Reset assistant conversation"
              title="Reset conversation"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="assistant-modal-close-btn"
              onClick={onClose}
              aria-label="Close assistant"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Content Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-sm">
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
              {msg.sender === "bot" ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="bg-slate-100/90 text-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed whitespace-pre-line shadow-xs">
                      {msg.text}
                    </div>
                    <div className="text-[11px] text-slate-400 pl-1">
                      {msg.timestamp}
                    </div>

                    {/* Quick Topics List directly under the 3rd bot message as in screenshot */}
                    {msg.isQuickTopics && (
                      <div className="pt-2 space-y-2">
                        {faqTopics.map((topic) => {
                          const IconComp = topic.icon;
                          return (
                            <button
                              type="button"
                              key={topic.id}
                              onClick={() => handleTopicClick(topic.query)}
                              className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/40 bg-white transition group text-left shadow-xs active:scale-[0.99]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${topic.iconBg}`}
                                >
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-slate-700 text-xs sm:text-sm group-hover:text-blue-700 truncate">
                                  {topic.title}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end space-y-1">
                  <div className="bg-purple-100/90 text-purple-950 font-medium px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed shadow-xs">
                    {msg.text}
                  </div>
                  <div className="text-[11px] text-slate-400 pr-1">
                    {msg.timestamp}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 px-4 py-3 rounded-2xl flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Searching campus records & preparing answer...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputQuery);
            }}
            className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/90 rounded-2xl px-3 py-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition"
          >
            <Sparkles className="w-5 h-5 text-blue-500 shrink-0 ml-1" />
            <input
              id="assistant-user-input"
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-transparent py-2 px-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              id="assistant-submit-btn"
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Powered by Gemini AI • Campus Lost & Found Knowledge Base</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateTab("browse");
              }}
              className="text-blue-600 hover:underline font-medium"
            >
              Browse live records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
