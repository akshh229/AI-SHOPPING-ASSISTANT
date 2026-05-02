/* =============================================================
   ShopSmart AI – app.js
   Lab: AI Assistant Builder (Flowise + OpenRouter)
   -------------------------------------------------------------
   BACKEND: OpenRouter (direct) — no Flowise server required.
   The same API key works whether you route through Flowise or
   call OpenRouter directly. Switch USE_OPENROUTER to false and
   fill FLOWISE_API_URL below when you have a Flowise endpoint.
   ============================================================= */

// ── ⚙️  CONFIGURATION ──────────────────────────────────────────

// ── OpenRouter (direct — active) ──────────────────────────────
const OPENROUTER_API_KEY = "sk-or-v1-REPLACE_WITH_YOUR_KEY"; // ⚠️ Add your OpenRouter key here for local use
const OPENROUTER_MODEL   = "openai/gpt-3.5-turbo"; // swap to any model at openrouter.ai/models
const USE_OPENROUTER     = true;  // ← true = use OpenRouter directly

// ── Flowise endpoint (fill when ready) ────────────────────────
const FLOWISE_API_URL = "https://YOUR-FLOWISE-URL/api/v1/prediction/YOUR-CHATFLOW-ID";
const FLOWISE_API_KEY = "";
const USE_FLOWISE     = false; // ← set true only after filling FLOWISE_API_URL above

// ── End Configuration ──────────────────────────────────────────

// Master system prompt sent to OpenRouter on every request
const SYSTEM_PROMPT = `You are ShopSmart AI, an intelligent multi-step shopping assistant.
Your task is to collect user requirements and recommend exactly 3 products based on
category, budget, preferences, and intended use.

Follow this strict order:
1. Welcome the user warmly (first message only)
2. Ask product category
3. Ask budget
4. Ask preferences
5. Ask intended use
6. Recommend exactly 3 products
7. Ask if the user wants alternatives

Rules:
- Ask ONE question at a time.
- Do NOT recommend products until you have all 4 details (category, budget, preferences, intended use).
- Once all details are collected, output recommendations in this exact format:

Category: <user category>
Budget: <user budget>
Preferences: <user preferences>
Use case: <intended use>

Top 3 Recommendations:
1. Product Name
   - Match score: High / Medium
   - Why it fits:
   - Best feature:
   - Good for:

2. Product Name
   - Match score: High / Medium
   - Why it fits:
   - Best feature:
   - Good for:

3. Product Name
   - Match score: High / Medium
   - Why it fits:
   - Best feature:
   - Good for:

Final line:
Would you like cheaper options, premium options, or similar alternatives?

- Be concise, helpful, and realistic. Give real product names.`;


// ── State ──────────────────────────────────────────────────────
const state = {
  step: 0,          // current step index (0 = not started)
  sessionId: null,  // Flowise session ID for conversation memory
  data: {           // collected user data across steps
    category: "",
    budget: "",
    preferences: "",
    intendedUse: "",
  },
  isTyping: false,
  history: [],      // {role, content} pairs for export
};

// ── Flow Definition ────────────────────────────────────────────
const FLOW_STEPS = [
  {
    id: 1, key: "welcome",
    aiMessage: `👋 **Welcome to ShopSmart AI!**\n\nI'm your personal shopping assistant, powered by AI. I'll ask you a few quick questions to understand exactly what you need — then recommend the **top 3 products** that perfectly match your budget, preferences, and use case.\n\nLet's get started! 🚀`,
    quickReplies: ["Let's go!", "Start shopping", "I'm ready"],
  },
  {
    id: 2, key: "category",
    aiMessage: `🛒 **Step 1 of 4 – Product Category**\n\nWhat type of product are you looking for? You can choose from the suggestions below or type your own category.`,
    quickReplies: ["💻 Laptop", "📱 Smartphone", "🎧 Headphones", "📷 Camera", "⌚ Smartwatch", "🎮 Gaming", "📺 TV / Monitor", "Other"],
    collectKey: "category",
  },
  {
    id: 3, key: "budget",
    aiMessage: `💰 **Step 2 of 4 – Budget Range**\n\nWhat is your approximate budget? This helps me filter out options that don't fit your price range.`,
    quickReplies: ["Under ₹5,000", "₹5k – ₹15k", "₹15k – ₹30k", "₹30k – ₹60k", "₹60k – ₹1L", "Above ₹1 Lakh"],
    collectKey: "budget",
  },
  {
    id: 4, key: "preferences",
    aiMessage: `✨ **Step 3 of 4 – Your Preferences**\n\nTell me what features or qualities matter most to you. For example: battery life, camera quality, durability, brand, design, performance, etc.\n\nFeel free to mention 2–3 things that are important to you!`,
    quickReplies: ["Battery life", "Performance / Speed", "Camera quality", "Lightweight & portable", "Premium brand", "Value for money"],
    collectKey: "preferences",
  },
  {
    id: 5, key: "intendedUse",
    aiMessage: `🎯 **Step 4 of 4 – Intended Use**\n\nHow do you plan to use this product? Your use case helps me match the right product for your lifestyle.`,
    quickReplies: ["Office / Work", "Gaming", "Student / College", "Travel & On-the-go", "Creative / Design", "Everyday casual use"],
    collectKey: "intendedUse",
  },
  {
    id: 6, key: "recommend",
    aiMessage: null, // Dynamically generated
    quickReplies: [],
  },
  {
    id: 7, key: "alternatives",
    aiMessage: `🔄 **Want to explore more options?**\n\nI can refine these recommendations based on your preference. What would you like to see?`,
    quickReplies: ["💸 Cheaper options", "👑 Premium options", "🔀 Similar alternatives", "🔁 Start over"],
  },
];

// ── DOM References ─────────────────────────────────────────────
const messagesArea = document.getElementById("messages-area");
const userInput    = document.getElementById("user-input");
const sendBtn      = document.getElementById("send-btn");
const chatStatus   = document.getElementById("chat-status");

// ── Initialise ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  state.sessionId = generateSessionId();
  setupEventListeners();
  startConversation();
});

function setupEventListeners() {
  sendBtn.addEventListener("click", handleUserSend);

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserSend();
    }
  });

  // Auto-resize textarea
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
  });

  document.getElementById("btn-restart").addEventListener("click", restartConversation);
  document.getElementById("btn-export").addEventListener("click", exportChat);
}

// ── Conversation Start ─────────────────────────────────────────
function startConversation() {
  state.step = 0;
  advanceStep();
}

async function advanceStep() {
  state.step++;
  const stepDef = FLOW_STEPS[state.step - 1];
  if (!stepDef) return;

  updateFlowUI(stepDef.id);

  // Step 6 = recommendations (needs special AI message)
  if (stepDef.key === "recommend") {
    await showTyping(1800);
    const recMsg = await getRecommendations();
    appendMessage("ai", recMsg, []);
    recordHistory("assistant", recMsg);
    await delay(600);
    appendMessage("ai", `🔄 **Would you like cheaper options, premium options, or similar alternatives?**`, [
      "💸 Cheaper options", "👑 Premium options", "🔀 Similar alternatives", "🔁 Start over"
    ]);
    state.step = 7;
    updateFlowUI(7);
    return;
  }

  await showTyping(900);
  appendMessage("ai", stepDef.aiMessage, stepDef.quickReplies || []);
  recordHistory("assistant", stepDef.aiMessage);
}

// ── Handle User Input ──────────────────────────────────────────
async function handleUserSend() {
  const text = userInput.value.trim();
  if (!text || state.isTyping) return;

  userInput.value = "";
  userInput.style.height = "auto";
  sendBtn.disabled = true;

  appendMessage("user", text, []);
  recordHistory("user", text);
  removeQuickReplies();

  const stepDef = FLOW_STEPS[state.step - 1];

  // Collect data for the current step
  if (stepDef && stepDef.collectKey) {
    state.data[stepDef.collectKey] = text;
  }

  // Handle "Start over"
  if (text.toLowerCase().includes("start over")) {
    await delay(500);
    restartConversation();
    return;
  }

  // Route: OpenRouter direct → Flowise → local simulation
  if (USE_OPENROUTER && state.step > 1) {
    await handleOpenRouterResponse(text);
  } else if (USE_FLOWISE && state.step > 1) {
    await handleFlowiseResponse(text);
  } else {
    await advanceStep();
  }

  sendBtn.disabled = false;
}

// ── OpenRouter Direct API Call ─────────────────────────────────
// Sends full conversation history + system prompt to OpenRouter.
// This means the AI has full memory of everything said so far.
async function handleOpenRouterResponse(userMessage) {
  state.isTyping = true;
  chatStatus.textContent = "ShopSmart AI is thinking…";
  showTypingBubble();

  // Build message array: system prompt + full conversation history
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...state.history.map(h => ({
      role: h.role === "assistant" ? "assistant" : "user",
      content: h.content.replace(/<[^>]+>/g, ""), // strip HTML tags
    })),
  ];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.href,
        "X-Title": "ShopSmart AI - AI Shopping Assistant",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
    }

    const json   = await res.json();
    const answer = json.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";

    removeTypingBubble();
    appendMessage("ai", answer, []);
    recordHistory("assistant", answer);

    // Auto-detect recommendation step to advance flow UI
    if (answer.includes("Top 3 Recommendations")) {
      updateFlowUI(6);
      state.step = 7;
    } else if (answer.toLowerCase().includes("cheaper") || answer.toLowerCase().includes("alternative")) {
      updateFlowUI(7);
    }

  } catch (err) {
    removeTypingBubble();
    console.error("[ShopSmart AI] OpenRouter Error:", err);
    appendMessage("ai",
      `⚠️ **OpenRouter Error:** ${err.message}\n\nFalling back to local mode — check your API key or try again.`,
      ["Try again"]
    );
  } finally {
    state.isTyping = false;
    chatStatus.textContent = "Online · Powered by OpenRouter";
  }
}

// ── Flowise API (fallback when USE_FLOWISE = true) ─────────────
async function handleFlowiseResponse(userMessage) {
  state.isTyping = true;
  chatStatus.textContent = "Connecting to Flowise…";
  showTypingBubble();

  try {
    const headers = { "Content-Type": "application/json" };
    if (FLOWISE_API_KEY) headers["Authorization"] = `Bearer ${FLOWISE_API_KEY}`;

    const res = await fetch(FLOWISE_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        question: userMessage,
        overrideConfig: { sessionId: state.sessionId },
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json   = await res.json();
    const answer = json.text || json.answer || "No response from Flowise.";

    removeTypingBubble();
    appendMessage("ai", answer, []);
    recordHistory("assistant", answer);

  } catch (err) {
    removeTypingBubble();
    console.error("[ShopSmart AI] Flowise Error:", err);
    appendMessage("ai",
      `⚠️ Flowise unreachable: ${err.message}\n\nCheck FLOWISE_API_URL in app.js.`,
      ["Try again"]
    );
  } finally {
    state.isTyping = false;
    chatStatus.textContent = "Online · Powered by Flowise + OpenRouter";
  }
}

// ── Recommendation Builder (local simulation) ──────────────────
async function getRecommendations() {
  const { category, budget, preferences, intendedUse } = state.data;

  // When Flowise is connected, this data would be sent to the chatflow
  // and the LLM (via OpenRouter) would generate real recommendations.
  // For now, we build a structured local simulation.

  const products = generateDemoProducts(category, budget, preferences, intendedUse);

  let msg = `✅ **Great! I have everything I need. Here are your personalized recommendations:**\n\n`;
  msg += `📋 **Summary**\n`;
  msg += `- **Category:** ${category || "General"}\n`;
  msg += `- **Budget:** ${budget || "Flexible"}\n`;
  msg += `- **Preferences:** ${preferences || "Balanced features"}\n`;
  msg += `- **Use Case:** ${intendedUse || "General use"}\n\n`;
  msg += `---\n\n🏆 **Top 3 Recommendations**\n\n`;

  products.forEach((p, i) => {
    msg += `**${i + 1}. ${p.name}**\n`;
    msg += `   • Match Score: **${p.match}**\n`;
    msg += `   • Why it fits: ${p.why}\n`;
    msg += `   • Best feature: ${p.feature}\n`;
    msg += `   • Good for: ${p.goodFor}\n\n`;
  });

  return msg;
}

function generateDemoProducts(category, budget, preferences, use) {
  // Smart demo product generator — in production, Flowise + OpenRouter handles this
  const cat = (category || "").toLowerCase();
  const pref = (preferences || "").toLowerCase();
  const useCase = (use || "").toLowerCase();

  const catalog = {
    laptop: [
      { name: "Dell XPS 15 (2024)", match: "High", why: `Ideal for ${useCase || "professional"} tasks with premium build and performance`, feature: "OLED display + 13th Gen Intel Core i7", goodFor: "Creative professionals & power users" },
      { name: "HP Pavilion 15", match: "High", why: "Outstanding value with solid everyday performance", feature: "AMD Ryzen 5, 512GB SSD, 16GB RAM", goodFor: "Students & everyday office work" },
      { name: "Lenovo IdeaPad Slim 5", match: "Medium", why: "Lightweight and budget-friendly without sacrificing speed", feature: "12-hour battery life, ultra-slim design", goodFor: "Travelers & college students" },
    ],
    smartphone: [
      { name: "Samsung Galaxy S24", match: "High", why: `Best-in-class camera and performance for ${useCase || "everyday"} use`, feature: "200MP camera, Snapdragon 8 Gen 3", goodFor: "Photography lovers & power users" },
      { name: "OnePlus 12R", match: "High", why: "Premium performance at a mid-range price point", feature: "100W fast charging, 5000mAh battery", goodFor: "Value seekers who don't compromise on speed" },
      { name: "Realme Narzo 70 Pro", match: "Medium", why: "Budget smartphone with a great AMOLED display", feature: "AMOLED 144Hz display, 67W charging", goodFor: "First-time buyers & students" },
    ],
    headphones: [
      { name: "Sony WH-1000XM5", match: "High", why: `Industry-leading ANC perfect for ${useCase || "commuting and focus"}`, feature: "30-hour battery + class-leading noise cancellation", goodFor: "Travelers, remote workers & audiophiles" },
      { name: "Boat Rockerz 550", match: "High", why: "Solid audio performance at an unbeatable Indian market price", feature: "70-hour playback, foldable design", goodFor: "Students & casual music listeners" },
      { name: "JBL Tune 770NC", match: "Medium", why: "JBL's signature bass-heavy sound with good ANC", feature: "70-hour battery, multi-point connection", goodFor: "Bass lovers & gym-goers" },
    ],
    default: [
      { name: "Product Recommendation A", match: "High", why: `Matches your requirement for ${preferences || "balanced features"} in the ${category || "chosen"} category`, feature: "Top-rated feature in its class", goodFor: `${use || "General"} use` },
      { name: "Product Recommendation B", match: "High", why: "Excellent balance of performance and value within your budget", feature: "Industry-leading efficiency and reliability", goodFor: "Users who prioritize long-term value" },
      { name: "Product Recommendation C", match: "Medium", why: "Strong alternative with slightly different trade-offs", feature: "Standout design and ease of use", goodFor: "Users who want a dependable everyday option" },
    ],
  };

  // Match category keyword
  if (cat.includes("laptop") || cat.includes("computer"))  return catalog.laptop;
  if (cat.includes("phone") || cat.includes("mobile"))      return catalog.smartphone;
  if (cat.includes("headphone") || cat.includes("earphone") || cat.includes("audio")) return catalog.headphones;
  return catalog.default;
}

// ── Message Rendering ──────────────────────────────────────────
function appendMessage(role, text, quickReplies = []) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = role === "ai" ? "🤖" : "👤";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = formatMarkdown(text);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesArea.appendChild(wrapper);

  // Quick reply chips
  if (quickReplies.length > 0) {
    const chipsRow = document.createElement("div");
    chipsRow.className = "quick-replies";
    chipsRow.setAttribute("role", "group");
    chipsRow.setAttribute("aria-label", "Quick reply options");

    quickReplies.forEach(label => {
      const chip = document.createElement("button");
      chip.className = "quick-chip";
      chip.textContent = label;
      chip.setAttribute("type", "button");
      chip.addEventListener("click", () => {
        userInput.value = label;
        handleUserSend();
      });
      chipsRow.appendChild(chip);
    });

    messagesArea.appendChild(chipsRow);
  }

  scrollToBottom();
}

// ── Typing Indicator ───────────────────────────────────────────
let typingEl = null;

function showTypingBubble() {
  if (typingEl) return;
  const wrapper = document.createElement("div");
  wrapper.className = "message ai";
  wrapper.id = "typing-bubble";

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "🤖";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesArea.appendChild(wrapper);
  typingEl = wrapper;
  scrollToBottom();
}

function removeTypingBubble() {
  if (typingEl) {
    typingEl.remove();
    typingEl = null;
  }
}

async function showTyping(ms = 1000) {
  state.isTyping = true;
  showTypingBubble();
  await delay(ms);
  removeTypingBubble();
  state.isTyping = false;
}

// ── Quick Reply Cleanup ────────────────────────────────────────
function removeQuickReplies() {
  document.querySelectorAll(".quick-replies").forEach(el => el.remove());
}

// ── Flow UI Update ─────────────────────────────────────────────
function updateFlowUI(activeStepId) {
  for (let i = 1; i <= 7; i++) {
    const el = document.getElementById(`step-${i}`);
    if (!el) continue;
    const num = el.querySelector(".step-num");

    el.classList.remove("active", "completed");
    num.textContent = i;

    if (i < activeStepId) {
      el.classList.add("completed");
      num.textContent = "";
    } else if (i === activeStepId) {
      el.classList.add("active");
    }
  }
}

// ── Markdown Formatter ─────────────────────────────────────────
function formatMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/---/g, "<hr>")
    .replace(/\n/g, "<br>");
}

// ── Restart ────────────────────────────────────────────────────
function restartConversation() {
  state.step = 0;
  state.data = { category: "", budget: "", preferences: "", intendedUse: "" };
  state.history = [];
  state.sessionId = generateSessionId();
  messagesArea.innerHTML = "";
  updateFlowUI(1);
  startConversation();
}

// ── Export Chat ────────────────────────────────────────────────
function exportChat() {
  if (state.history.length === 0) {
    alert("No conversation to export yet!");
    return;
  }

  const lines = ["ShopSmart AI – Chat Export", "=".repeat(40), ""];
  state.history.forEach(h => {
    lines.push(`[${h.role.toUpperCase()}]`);
    lines.push(h.content.replace(/<[^>]+>/g, ""));
    lines.push("");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "shopsmart-ai-chat.txt";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helpers ────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function generateSessionId() {
  return "ss-" + Math.random().toString(36).slice(2, 10) + "-" + Date.now();
}

function scrollToBottom() {
  messagesArea.scrollTo({ top: messagesArea.scrollHeight, behavior: "smooth" });
}

function recordHistory(role, content) {
  state.history.push({ role, content });
}

// ── Console welcome note ───────────────────────────────────────
console.log(`%c🛍️ ShopSmart AI`, "font-size:18px;font-weight:bold;color:#6366f1");
console.log(`%cPowered by OpenRouter (${OPENROUTER_MODEL})`, "color:#22d3ee");
console.log(`%cUSE_OPENROUTER: ${USE_OPENROUTER} | USE_FLOWISE: ${USE_FLOWISE}`, "color:#94a3b8");
