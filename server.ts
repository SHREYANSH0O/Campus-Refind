import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini SDK lazily / safely
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Assistant Chat Route
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], contextItems = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getGenAI();

    // Context preparation about current items
    const contextSummary = contextItems.length > 0
      ? `Current campus items database overview (${contextItems.length} active/recent reports):
` +
        contextItems
          .slice(0, 15)
          .map(
            (item: any) =>
              `- [${item.type?.toUpperCase() || "ITEM"}] "${item.title}" (${item.category || "General"}) | Location: "${item.location || "Campus"}" | Status: ${item.status || "open"} | Date: ${item.date || "Recent"}`
          )
          .join("\n")
      : "No items currently logged in database.";

    const systemInstruction = `You are the friendly, professional, and knowledgeable "Campus ReFind Assistant" for a university campus Lost & Found system.
Your mission is to help students, faculty, and campus staff report lost or found belongings, understand the claim and verification process, coordinate secure handovers at the campus lost & found desk, and resolve tickets.

Campus Guidelines & Knowledge:
1. Reporting:
   - Lost items: Provide accurate item name, category, approximate location (e.g. A Block, B Block, Canteen, Central library, Campus Playground, Vivekanand Hall), date/time, and identifiable features.
   - Found items: Report item name and location where found. Advise finder to keep distinct identifiers (like serial numbers, keychain charms, phone lock screens, or internal wallet items) private as secret verification details.
2. Claiming & Verification:
   - Any campus member with authentic login credentials can browse tickets and submit a claim.
   - To claim, claimant must provide proof of ownership (e.g., describing secret marks, lock screen wallpaper, serial numbers, unique scratches, or receipt/ID).
   - The reporter or Campus Security reviews the answers before approving.
3. Handover & Closing Tickets:
   - Handover is conducted at the official Campus Lost & Found Desk (Vivekanand Hall Central Desk, Mon-Fri 8:00 AM - 7:00 PM, Sat 10:00 AM - 3:00 PM) managed by Campus Security (Officer Marcus Vance).
   - When a claim is approved, a unique 6-digit Handover Code (e.g. REFIND-8841) is issued.
   - The "Security & Desk" portal enables officers to verify claimant student IDs, compare secret identifiers, and sign off to safely mark tickets "Returned & Closed".
4. Active Inventory Context:
${contextSummary}

Style:
- Keep answers helpful, empathetic, concise, and easy to read with bullet points when explaining steps.
- If the user asks whether a specific item (e.g. AirPods, keys, calculator, water bottle) was reported, refer to the active inventory context above.
- Always maintain campus safety standards and encourage verification before handing over belongings.`;

    // Attempt Gemini call if AI client is initialized
    if (ai) {
      try {
        // Sanitize multi-turn history for Gemini:
        // 1. Must alternate strictly between 'user' and 'model'
        // 2. Must start with 'user'
        const sanitizedContents: { role: "user" | "model"; parts: { text: string }[] }[] = [];
        let expectedRole: "user" | "model" = "user";

        for (const msg of history) {
          if (!msg || !msg.text || typeof msg.text !== "string") continue;
          const role: "user" | "model" = msg.role === "user" ? "user" : "model";
          if (role === expectedRole) {
            sanitizedContents.push({
              role,
              parts: [{ text: msg.text.trim() }],
            });
            expectedRole = expectedRole === "user" ? "model" : "user";
          }
        }

        // If the last history turn is 'user', remove it so we can append current message
        if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === "user") {
          sanitizedContents.pop();
        }

        // Append the current user prompt
        sanitizedContents.push({
          role: "user",
          parts: [{ text: message.trim() }],
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: sanitizedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        if (response && response.text) {
          return res.json({ reply: response.text });
        }
      } catch (geminiError: any) {
        console.warn("Gemini generation notice:", geminiError?.message || geminiError);
        // Seamlessly fall through to knowledge base engine below
      }
    }

    // Comprehensive Campus Knowledge Base Engine (used when Gemini is unavailable or errors)
    const reply = resolveCampusKnowledgeQuery(message, contextItems);
    return res.json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    const fallbackReply = resolveCampusKnowledgeQuery(req.body?.message || "", req.body?.contextItems || []);
    return res.json({ reply: fallbackReply });
  }
});

/**
 * Intelligent Campus Knowledge Base Query Resolver
 */
function resolveCampusKnowledgeQuery(queryText: string, contextItems: any[] = []): string {
  const lower = queryText.toLowerCase().trim();

  // 1. Where do I collect an approved item? / Collection Desk / Location
  if (
    lower.includes("collect") ||
    (lower.includes("where") && (lower.includes("item") || lower.includes("approved") || lower.includes("desk") || lower.includes("pick") || lower.includes("handover") || lower.includes("office"))) ||
    lower.includes("pickup") ||
    lower.includes("pick up") ||
    lower.includes("desk location")
  ) {
    return (
      `### 📍 Where to Collect Your Approved Item\n\n` +
      `Approved items can be collected safely in person at the official campus collection desk:\n\n` +
      `* **Building & Room**: **Vivekanand Hall — Central Lost & Found Desk** (Ground Floor, Room 104)\n` +
      `* **Desk Incharge**: Officer Marcus Vance / Central Security Team\n` +
      `* **Desk Operating Hours**:\n` +
      `  * **Monday – Friday**: 8:00 AM – 7:00 PM\n` +
      `  * **Saturday**: 10:00 AM – 3:00 PM\n` +
      `  * **Sunday & Campus Holidays**: Closed (Emergency security contact available at Main Gate)\n\n` +
      `**What to Bring for Verification**:\n` +
      `1. Your official **Campus Student / Faculty ID card**\n` +
      `2. Your unique **6-digit Handover Code** (found under **"My claims"** in the sidebar, e.g. \`REFIND-XXXX\`)\n` +
      `3. Any password/PIN to unlock electronic devices if applicable.`
    );
  }

  // 2. How do I check my claim status? / Check claim
  if (
    lower.includes("claim status") ||
    lower.includes("check my claim") ||
    lower.includes("status of my claim") ||
    lower.includes("track my claim") ||
    (lower.includes("how") && lower.includes("claim") && lower.includes("status"))
  ) {
    return (
      `### 🔍 How to Check Your Claim Status\n\n` +
      `You can check the real-time status of all your submitted claims directly inside Campus ReFind:\n\n` +
      `1. Click on **"My claims"** in the left-hand navigation sidebar.\n` +
      `2. You will see a list of your submitted claims with their live status badges:\n` +
      `   * 🟡 **Under Verification**: The finder or Security Officer is reviewing your submitted proof of ownership.\n` +
      `   * 🟢 **Approved — Ready for Handover**: Your claim was verified! Your unique 6-digit **REFIND Handover Code** will be displayed.\n` +
      `   * 🔴 **Claim Rejected**: The provided proof did not match the item's private verification criteria. You can submit additional proof if needed.\n` +
      `   * ⚪ **Returned & Closed**: The item has been safely handed over to you at the desk.\n\n` +
      `*Tip: You also receive instant in-app alerts under **Notifications** the moment your claim is approved or updated!*`
    );
  }

  // 3. What happens after I submit a claim?
  if (
    (lower.includes("what happens") || lower.includes("after")) &&
    lower.includes("claim")
  ) {
    return (
      `### ⏱️ What Happens After You Submit a Claim?\n\n` +
      `Here is the step-by-step verification and handover journey:\n\n` +
      `1. **Security & Finder Review**:\n` +
      `   * The report status changes to **"Under Verification"**.\n` +
      `   * The finder or Campus Security Desk reviews your answers against the item's secret identifiers (e.g. lock screen wallpaper, serial numbers, engraved markings, or internal contents).\n\n` +
      `2. **Approval & Handover Code Issuance**:\n` +
      `   * Once approved, Campus ReFind issues a tamper-proof 6-digit code (e.g. \`REFIND-4821\`).\n` +
      `   * An in-app alert is sent to your notification center.\n\n` +
      `3. **Physical Collection**:\n` +
      `   * Visit the **Vivekanand Hall Central Desk** with your Campus ID and show your code.\n` +
      `   * The officer validates the code in the system and marks the ticket **"Returned & Closed"**!`
    );
  }

  // 4. How do I report a lost or found item?
  if (
    lower.includes("how do i report") ||
    lower.includes("how to report") ||
    (lower.includes("report") && (lower.includes("item") || lower.includes("lost") || lower.includes("found")))
  ) {
    return (
      `### 📝 How to Report a Lost or Found Item\n\n` +
      `Filing a report takes less than a minute:\n\n` +
      `1. Click the **"Report an item"** button in the sidebar or top bar.\n` +
      `2. Choose whether you:\n` +
      `   * **Lost Something**: Enter the item name, category, date, and where you last saw it (e.g. *Central library, Canteen, Vivekanand Hall, A-E Blocks*).\n` +
      `   * **Found Something**: Enter where you found it. You can securely keep distinct details (like serial numbers or lock screen designs) as secret verification questions so only the rightful owner can claim it.\n` +
      `3. Upload a photo or select an image if available.\n` +
      `4. Click **"Publish Report"**. Your ticket will instantly appear on the campus dashboard and notify subscribed members!`
    );
  }

  // 5. How do I claim an item?
  if (
    lower.includes("how do i claim") ||
    lower.includes("how to claim") ||
    lower.includes("claim an item") ||
    lower.includes("claim process")
  ) {
    return (
      `### 🛡️ How to Claim an Item You See on the Portal\n\n` +
      `If you spot your belonging in **"Browse reports"** or on the **Dashboard**:\n\n` +
      `1. Click on the item card to open its **Item Details**.\n` +
      `2. Click the **"Claim this Item"** button.\n` +
      `3. Complete the verification form by answering the ownership questions:\n` +
      `   * Describe specific identifiers (e.g., specific scratches, phone lockscreen image, key tag colors, case brands, or purchase bill).\n` +
      `   * Enter your contact phone number.\n` +
      `4. Submit your claim. The security desk or finder will review your details within 24 hours.`
    );
  }

  // 6. Check for specific item queries in current inventory (e.g. AirPods, keys, calculator, bottle)
  if (contextItems && contextItems.length > 0) {
    const keywords = ["airpod", "phone", "iphone", "samsung", "calculator", "key", "wallet", "bottle", "bag", "id card", "watch", "jacket", "book", "glasses", "headphone", "earphone", "umbrella"];
    const matchedKeyword = keywords.find((k) => lower.includes(k));

    if (matchedKeyword) {
      const matchedItems = contextItems.filter(
        (it) =>
          it.title?.toLowerCase().includes(matchedKeyword) ||
          it.category?.toLowerCase().includes(matchedKeyword) ||
          it.description?.toLowerCase().includes(matchedKeyword)
      );

      if (matchedItems.length > 0) {
        let resp = `### 🔎 Results for "${matchedKeyword}" on Campus:\n\nWe found **${matchedItems.length}** item(s) matching your inquiry:\n\n`;
        matchedItems.slice(0, 4).forEach((item) => {
          const typeBadge = item.type === "found" ? "🟢 FOUND" : "🔵 LOST";
          resp += `* **[${typeBadge}] ${item.title}**\n  * **Location**: ${item.location}\n  * **Status**: ${item.status === "open" ? "Available / Open" : item.status}\n  * **Date**: ${item.date}\n  * **Ticket**: \`${item.ticketNumber || item.id}\`\n\n`;
        });
        resp += `You can view the full details and photos by clicking **"Browse reports"** in the sidebar.`;
        return resp;
      }
    }
  }

  // 7. Security desk / Admin inquiries
  if (
    lower.includes("security") ||
    lower.includes("officer") ||
    lower.includes("admin") ||
    lower.includes("marcus") ||
    lower.includes("vikram")
  ) {
    return (
      `### 👮 Campus Security & Central Desk Assistance\n\n` +
      `* **Desk Head**: Officer Marcus Vance / Campus Safety Incharge\n` +
      `* **Physical Location**: Vivekanand Hall Central Security Desk, Room 104\n` +
      `* **Emergency Contact**: Security Control Room Ext. 4401\n` +
      `* **Security Officers Portal**: Authorized campus security personnel can click **"Security & Desk"** in the sidebar to review pending claims, scan 6-digit handover codes, and close completed tickets.`
    );
  }

  // 8. Default intelligent campus guidance
  return (
    `### 🎓 Campus ReFind Assistant\n\n` +
    `I can assist you with any questions about campus lost & found belongings! Here are some common things you can ask me:\n\n` +
    `* 📍 *"Where do I collect an approved item?"*\n` +
    `* 🔍 *"How do I check my claim status?"*\n` +
    `* 📝 *"How do I report a lost or found item?"*\n` +
    `* 🛡️ *"How does the handover code verification work?"*\n` +
    `* 🔎 *"Has anyone found my AirPods or keys?"*\n\n` +
    `Feel free to type any specific question or choose from the suggested topics above!`
  );
}

// Vite middleware for dev or static serving for prod
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
