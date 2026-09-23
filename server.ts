import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import dns from "dns";

dotenv.config();

const app = express();

/*
 * IMPORTANT FOR RENDER
 *
 * Render provides the PORT environment variable.
 * Locally, we fall back to 3000.
 */
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

/* =========================================================
   DISPOSABLE EMAIL DOMAINS
   ========================================================= */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "fake.com",
  "fakemail.com",
  "throwawaymail.com",
  "throwaway.email",
  "sharklasers.com",
  "getairmail.com",
  "dispostable.com",
  "trashmail.com",
  "emailfake.com",
  "generator.email",
  "crazymailing.com",
  "burnermail.io",
  "maildrop.cc",
  "inboxkitten.com",
  "trashmail.net",
  "mytemp.email"
]);

/* =========================================================
   GEMINI
   ========================================================= */

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "Campus-ReFind",
        },
      },
    });
  }

  return aiClient;
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

app.post("/api/validate-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        valid: false,
        error: "Please enter a valid email address."
      });
    }

    const trimmed = email.trim().toLowerCase();

    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(trimmed)) {
      return res.status(400).json({
        valid: false,
        error:
          "Invalid email syntax. Please enter a valid address."
      });
    }

    const parts = trimmed.split("@");
    const domain = parts[1];

    /* Block disposable email providers */

    if (DISPOSABLE_DOMAINS.has(domain)) {
      return res.status(400).json({
        valid: false,
        error:
          `Temporary or burner email services (@${domain}) are prohibited on Campus ReFind.`
      });
    }

    /* Check MX records */

    try {
      const mxRecords = await dns.promises.resolveMx(domain);

      if (!mxRecords || mxRecords.length === 0) {
        return res.status(400).json({
          valid: false,
          error:
            `The domain '@${domain}' does not have an active mail server.`
        });
      }

      return res.json({
        valid: true,
        domain,
        exchange: mxRecords[0].exchange
      });

    } catch (dnsError: any) {
      const trustedDomains = [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
        "icloud.com",
        "proton.me",
        "protonmail.com"
      ];

      if (
        trustedDomains.includes(domain) ||
        domain.endsWith(".edu") ||
        domain.endsWith(".ac.in")
      ) {
        return res.json({
          valid: true,
          domain
        });
      }

      if (
        dnsError?.code === "ENOTFOUND" ||
        dnsError?.code === "ENODATA" ||
        dnsError?.code === "ESERVFAIL"
      ) {
        return res.status(400).json({
          valid: false,
          error:
            `The email domain '@${domain}' does not appear to exist.`
        });
      }

      return res.status(400).json({
        valid: false,
        error:
          `Could not verify the mail server for '@${domain}'.`
      });
    }

  } catch (error) {
    console.error("Email validation error:", error);

    return res.status(500).json({
      valid: false,
      error: "Email validation check failed."
    });
  }
});

/* =========================================================
   CAMPUS KNOWLEDGE BASE
   ========================================================= */

function resolveCampusKnowledgeQuery(
  queryText: string,
  contextItems: any[] = []
): string {

  const lower = String(queryText || "")
    .toLowerCase()
    .trim();

  /* ---------------------------------------------------------
     COLLECTION / PICKUP
     --------------------------------------------------------- */

  if (
    lower.includes("collect") ||
    lower.includes("pickup") ||
    lower.includes("pick up") ||
    lower.includes("handover") ||
    lower.includes("desk location") ||
    (
      lower.includes("where") &&
      (
        lower.includes("item") ||
        lower.includes("approved") ||
        lower.includes("desk") ||
        lower.includes("office")
      )
    )
  ) {
    return `
### 📍 Where to Collect Your Approved Item

Approved items can be collected safely at the official campus collection desk.

**Building & Room:**  
Vivekanand Hall — Central Lost & Found Desk  
Ground Floor, Room 104

**Desk Incharge:**  
Officer Marcus Vance / Central Security Team

**Desk Hours:**
- Monday – Friday: 8:00 AM – 7:00 PM
- Saturday: 10:00 AM – 3:00 PM
- Sunday & campus holidays: Closed

### What to Bring

1. Your official Campus Student / Faculty ID
2. Your REFIND handover code
3. Any required password/PIN to verify an electronic device

Always complete verification before accepting an item.
`;
  }

  /* ---------------------------------------------------------
     CLAIM STATUS
     --------------------------------------------------------- */

  if (
    lower.includes("claim status") ||
    lower.includes("check my claim") ||
    lower.includes("status of my claim") ||
    lower.includes("track my claim") ||
    (
      lower.includes("claim") &&
      lower.includes("status")
    )
  ) {
    return `
### 🔍 How to Check Your Claim Status

1. Open **My Claims** from the sidebar.
2. Find the claim you submitted.
3. Check its current status.

Possible statuses include:

- 🟡 **Under Verification**
- 🟢 **Approved — Ready for Handover**
- 🔴 **Claim Rejected**
- ⚪ **Returned & Closed**

You can also check **Notifications** for updates to your claims.
`;
  }

  /* ---------------------------------------------------------
     AFTER SUBMITTING CLAIM
     --------------------------------------------------------- */

  if (
    (
      lower.includes("what happens") ||
      lower.includes("after")
    ) &&
    lower.includes("claim")
  ) {
    return `
### ⏱️ What Happens After You Submit a Claim?

**1. Verification**

The finder or Campus Security reviews your proof of ownership.

**2. Approval**

If your proof matches the private verification details, the claim can be approved.

**3. Handover Code**

An REFIND handover code is generated for the approved claim.

**4. Physical Collection**

Take your Campus ID and handover code to the official Lost & Found Desk.

The officer verifies the information before marking the item as returned.
`;
  }

  /* ---------------------------------------------------------
     REPORTING
     --------------------------------------------------------- */

  if (
    lower.includes("how do i report") ||
    lower.includes("how to report") ||
    (
      lower.includes("report") &&
      (
        lower.includes("item") ||
        lower.includes("lost") ||
        lower.includes("found")
      )
    )
  ) {
    return `
### 📝 How to Report a Lost or Found Item

1. Click **Report an item**.
2. Choose **Lost** or **Found**.
3. Enter the item name and category.
4. Add the location.
5. Add the date and relevant details.
6. Upload a photo if available.
7. Submit the report.

For found items, keep private identifiers such as serial numbers or unique marks hidden from the public listing. They can be used later for ownership verification.
`;
  }

  /* ---------------------------------------------------------
     CLAIMING
     --------------------------------------------------------- */

  if (
    lower.includes("how do i claim") ||
    lower.includes("how to claim") ||
    lower.includes("claim an item") ||
    lower.includes("claim process")
  ) {
    return `
### 🛡️ How to Claim an Item

1. Open **Browse Reports**.
2. Select the item that appears to belong to you.
3. Open the item details.
4. Click **Claim this Item**.
5. Provide proof of ownership.
6. Submit your claim.
7. Wait for the verification result.

Useful proof can include:

- Unique scratches
- Serial numbers
- Lock-screen details
- Keychain details
- Purchase information
- Other private identifying information

Never publicly post sensitive identifiers.
`;
  }

  /* ---------------------------------------------------------
     INVENTORY SEARCH
     --------------------------------------------------------- */

  if (Array.isArray(contextItems) && contextItems.length > 0) {

    const keywords = [
      "airpod",
      "phone",
      "iphone",
      "samsung",
      "calculator",
      "key",
      "wallet",
      "bottle",
      "bag",
      "id card",
      "watch",
      "jacket",
      "book",
      "glasses",
      "headphone",
      "earphone",
      "umbrella"
    ];

    const matchedKeyword = keywords.find((keyword) =>
      lower.includes(keyword)
    );

    if (matchedKeyword) {

      const matchedItems = contextItems.filter((item) => {

        const title =
          String(item?.title || "").toLowerCase();

        const category =
          String(item?.category || "").toLowerCase();

        const description =
          String(item?.description || "").toLowerCase();

        return (
          title.includes(matchedKeyword) ||
          category.includes(matchedKeyword) ||
          description.includes(matchedKeyword)
        );
      });

      if (matchedItems.length > 0) {

        let response =
          `### 🔎 Results for "${matchedKeyword}"\n\n`;

        response +=
          `Found ${matchedItems.length} matching report(s):\n\n`;

        matchedItems.slice(0, 5).forEach((item) => {

          const typeBadge =
            item?.type === "found"
              ? "🟢 FOUND"
              : "🔵 LOST";

          response +=
            `- **[${typeBadge}] ${item?.title || "Unknown item"}**\n`;

          response +=
            `  - Location: ${item?.location || "Campus"}\n`;

          response +=
            `  - Status: ${item?.status || "Open"}\n`;

          response +=
            `  - Date: ${item?.date || "Recent"}\n`;

          response +=
            `  - Ticket: ${item?.ticketNumber || item?.id || "N/A"}\n\n`;
        });

        response +=
          `Open **Browse Reports** to view the full report.`;

        return response;
      }

      return `
### 🔎 No Matching Report Found

I couldn't find an active report matching **${matchedKeyword}** in the current inventory context.

Try checking **Browse Reports** for the latest listings.
`;
    }
  }

  /* ---------------------------------------------------------
     SECURITY
     --------------------------------------------------------- */

  if (
    lower.includes("security") ||
    lower.includes("officer") ||
    lower.includes("admin") ||
    lower.includes("marcus")
  ) {
    return `
### 👮 Campus Security & Lost & Found Desk

**Location:**  
Vivekanand Hall Central Security Desk, Room 104

**Desk Head:**  
Officer Marcus Vance / Campus Safety Team

**Hours:**
- Monday – Friday: 8:00 AM – 7:00 PM
- Saturday: 10:00 AM – 3:00 PM

Authorized security personnel can use the **Security & Desk** portal to review claims and complete item handovers.
`;
  }

  /* ---------------------------------------------------------
     DEFAULT
     --------------------------------------------------------- */

  return `
### 🎓 Campus ReFind Assistant

I can help you with Campus ReFind.

You can ask:

- 📍 "Where do I collect an approved item?"
- 🔍 "How do I check my claim status?"
- 📝 "How do I report a lost item?"
- 🛡️ "How do I claim an item?"
- 🔎 "Has anyone found my AirPods?"
- 👮 "Where is the security desk?"

For ownership claims, always provide proper verification before collecting an item.
`;
}

/* =========================================================
   AI CHAT
   ========================================================= */

app.post("/api/chat", async (req, res) => {

  try {

    const {
      message,
      history = [],
      contextItems = []
    } = req.body;

    if (
      !message ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const ai = getGenAI();

    /* -------------------------------------------------------
       Prepare current inventory context
       ------------------------------------------------------- */

    const contextSummary =
      Array.isArray(contextItems) &&
      contextItems.length > 0
        ? `
Current campus inventory:

${contextItems
  .slice(0, 20)
  .map((item: any) =>
    `- [${String(item?.type || "item").toUpperCase()}] ${
      item?.title || "Unknown item"
    } | Category: ${
      item?.category || "General"
    } | Location: ${
      item?.location || "Campus"
    } | Status: ${
      item?.status || "open"
    } | Date: ${
      item?.date || "Recent"
    }`
  )
  .join("\n")}
`
        : "No current inventory information is available.";

    /* -------------------------------------------------------
       Gemini system instruction
       ------------------------------------------------------- */

    const systemInstruction = `
You are the friendly and professional "Campus ReFind Assistant".

Campus ReFind is a university Lost & Found application.

Help users with:

- Reporting lost belongings
- Reporting found belongings
- Finding reported items
- Understanding claims
- Ownership verification
- Handover procedures
- Campus Lost & Found Desk information

Important safety rules:

- Never reveal private ownership verification information.
- Encourage users to verify ownership before handing over an item.
- Do not invent inventory records.
- Use the provided inventory context when answering questions about reported items.
- Keep answers concise and easy to understand.

Campus Lost & Found Desk:

Vivekanand Hall — Central Lost & Found Desk
Ground Floor, Room 104

Hours:

Monday-Friday: 8:00 AM - 7:00 PM
Saturday: 10:00 AM - 3:00 PM

Current inventory context:
${contextSummary}
`;

    /* -------------------------------------------------------
       Gemini request
       ------------------------------------------------------- */

    if (ai) {

      try {

        const sanitizedContents: Array<{
          role: "user" | "model";
          parts: Array<{ text: string }>;
        }> = [];

        let expectedRole: "user" | "model" = "user";

        if (Array.isArray(history)) {

          for (const msg of history) {

            if (
              !msg ||
              typeof msg.text !== "string" ||
              !msg.text.trim()
            ) {
              continue;
            }

            const role: "user" | "model" =
              msg.role === "user"
                ? "user"
                : "model";

            if (role !== expectedRole) {
              continue;
            }

            sanitizedContents.push({
              role,
              parts: [
                {
                  text: msg.text.trim()
                }
              ]
            });

            expectedRole =
              expectedRole === "user"
                ? "model"
                : "user";
          }
        }

        /* Remove a previous user turn if necessary */

        if (
          sanitizedContents.length > 0 &&
          sanitizedContents[
            sanitizedContents.length - 1
          ].role === "user"
        ) {
          sanitizedContents.pop();
        }

        sanitizedContents.push({
          role: "user",
          parts: [
            {
              text: message.trim()
            }
          ]
        });

        const response =
          await ai.models.generateContent({

            model: "gemini-3.8-flash",

            contents: sanitizedContents,

            config: {
              systemInstruction,
              temperature: 0.7
            }

          });

        if (
          response &&
          response.text
        ) {

          return res.json({
            reply: response.text
          });
        }

      } catch (geminiError: any) {

        console.warn(
          "Gemini request failed. Using local knowledge base.",
          geminiError?.message || geminiError
        );
      }
    }

    /* -------------------------------------------------------
       Local fallback
       ------------------------------------------------------- */

    const reply =
      resolveCampusKnowledgeQuery(
        message,
        Array.isArray(contextItems)
          ? contextItems
          : []
      );

    return res.json({
      reply
    });

  } catch (error: any) {

    console.error(
      "Chat API error:",
      error
    );

    const fallback =
      resolveCampusKnowledgeQuery(
        req.body?.message || "",
        Array.isArray(req.body?.contextItems)
          ? req.body.contextItems
          : []
      );

    return res.json({
      reply: fallback
    });
  }
});

/* =========================================================
   VITE / PRODUCTION SERVER
   ========================================================= */

async function startServer() {

  try {

    if (
      process.env.NODE_ENV !== "production"
    ) {

      const vite =
        await createViteServer({

          server: {
            middlewareMode: true
          },

          appType: "spa"

        });

      app.use(vite.middlewares);

    } else {

      const distPath =
        path.join(
          process.cwd(),
          "dist"
        );

      app.use(
        express.static(distPath)
      );

      app.get("*", (_req, res) => {

        res.sendFile(
          path.join(
            distPath,
            "index.html"
          )
        );

      });
    }

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `Campus ReFind server running on 0.0.0.0:${PORT}`
        );

        console.log(
          `Environment: ${
            process.env.NODE_ENV || "development"
          }`
        );

        console.log(
          `Gemini API: ${
            process.env.GEMINI_API_KEY
              ? "configured"
              : "not configured"
          }`
        );
      }
    );

  } catch (error) {

    console.error(
      "Failed to start Campus ReFind server:",
      error
    );

    process.exit(1);
  }
}

/* =========================================================
   START
   ========================================================= */

startServer();