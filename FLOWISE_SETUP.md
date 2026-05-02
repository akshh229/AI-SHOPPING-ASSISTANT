# ShopSmart AI – Flowise Chatflow Setup Guide
## AI Assistant Builder Lab | Flowise + OpenRouter

---

## ✅ COMPLETION STATUS

| Task | Status |
|------|--------|
| Frontend web app (HTML/CSS/JS) | ✅ Done |
| 7-step conversation flow | ✅ Done |
| Flowise API placeholder in app.js | ✅ Done |
| System prompt template | ✅ Done |
| Flowise node-by-node setup guide | ✅ This file |
| Testing instructions | ✅ Below |

---

## STEP 1 — Open Flowise & Create New Chatflow

1. Start Flowise: `npx flowise start`
2. Open browser → `http://localhost:3000`
3. Click **"Add New"** → name it: `ShopSmart AI – Shopping Assistant`

---

## STEP 2 — Add These 4 Nodes (in order)

### NODE 1 — Chat Input
- Search: **"Chat Input"**
- Drag onto canvas
- No configuration needed
- This receives the user's message

---

### NODE 2 — Chat Prompt Template
- Search: **"Chat Prompt Template"**
- Drag onto canvas
- Click the node → go to **System Message** field
- Paste this exact prompt:

```
You are ShopSmart AI, an intelligent multi-step shopping assistant.
Your task is to collect user requirements and recommend exactly 3 products
based on category, budget, preferences, and intended use.

Follow this order:
1. Welcome the user warmly
2. Ask product category
3. Ask budget
4. Ask preferences
5. Ask intended use
6. Recommend exactly 3 products
7. Ask if the user wants alternatives

Rules:
- Ask ONE question at a time.
- Do NOT recommend products until you have all 4 details.
- If category is missing → ask for category.
- If budget is missing → ask for budget.
- If preferences are missing → ask for preferences.
- If intended use is missing → ask for intended use.
- Once all details are available, give 3 recommendations in the format below.
- Be concise, helpful, and realistic.

Output format (use ONLY after collecting all details):

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
```

- In the **Human Message** field, type: `{input}`

---

### NODE 3 — OpenRouter (LLM)
- Search: **"ChatOpenAI"** or **"OpenRouter"**
- If using ChatOpenAI node for OpenRouter:
  - **Base URL:** `https://openrouter.ai/api/v1`
  - **API Key:** `[PASTE YOUR OPENROUTER API KEY HERE]`
  - **Model Name:** `openai/gpt-3.5-turbo`
    *(or any model from openrouter.ai/models)*
  - **Temperature:** `0.7`
  - **Max Tokens:** `1500`

> **Popular free OpenRouter models:**
> - `openai/gpt-3.5-turbo`
> - `mistralai/mistral-7b-instruct`
> - `google/gemma-7b-it`

---

### NODE 4 — Chat Output
- Search: **"Chat Output"**
- Drag onto canvas
- No configuration needed
- This sends the AI response back to the user

---

## STEP 3 — Connect the Nodes

Connect in this exact order:

```
[Chat Input] ──► [Chat Prompt Template]
                          │
                          ▼
                   [OpenRouter LLM]
                          │
                          ▼
                   [Chat Output]
```

**How to connect:**
- Hover over a node → a small dot appears on the right edge
- Drag from that dot to the left edge of the next node
- Chat Input → Prompt Template (connect `input` → `Human Message`)
- Prompt Template → LLM (connect `prompt` → `prompt`)
- LLM → Chat Output (connect `text` → `output`)

---

## STEP 4 — Enable Memory (Optional but Recommended)

To maintain conversation history across messages:

- Search: **"Buffer Memory"** node
- Drag onto canvas
- Connect it to the **ChatOpenAI / LLM** node's `memory` input
- Set **Memory Key:** `chat_history`
- Set **Session ID:** leave as default (auto per session)

---

## STEP 5 — Save & Get Your Endpoint

1. Click **💾 Save** (top right)
2. Click **🔗 API Endpoint** button
3. Copy the URL — it looks like:
   ```
   https://your-flowise-host/api/v1/prediction/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
4. Open `app.js` in your project
5. Replace line 9:
   ```js
   const FLOWISE_API_URL = "PASTE YOUR ENDPOINT HERE";
   ```
6. Set line 17:
   ```js
   const USE_FLOWISE = true;
   ```

---

## STEP 6 — Test the Chatflow

### Inside Flowise (built-in chat tester):
Click the **💬 Chat** button in the top-right of your chatflow.

Use these test inputs in order:

| Turn | You Type | Expected Response |
|------|----------|-------------------|
| 1 | `Hello` | Welcome message + asks category |
| 2 | `I want headphones` | Asks for budget |
| 3 | `My budget is 3000 INR` | Asks for preferences |
| 4 | `I want good bass and battery life` | Asks for intended use |
| 5 | `Mainly for music and gaming` | Shows Top 3 recommendations |
| 6 | `Cheaper options please` | Suggests budget alternatives |

---

## STEP 7 — Deploy Flowise (for submission)

### Option A — Render.com (Free)
1. Push Flowise to GitHub or use the official Docker image
2. Deploy on render.com → set env `PORT=3000`
3. Your endpoint becomes: `https://your-app.onrender.com/api/v1/prediction/...`

### Option B — Keep Local
- Run `npx flowise start` before demo
- Use `http://localhost:3000/api/v1/prediction/YOUR-ID`
- Frontend works at `http://localhost:7890`

---

## Node Summary (Quick Reference)

| # | Node | Type | Key Config |
|---|------|------|-----------|
| 1 | Chat Input | Input | None |
| 2 | Chat Prompt Template | Prompt | System prompt + `{input}` |
| 3 | ChatOpenAI (OpenRouter) | LLM | Base URL + API Key + Model |
| 4 | Buffer Memory | Memory | Memory Key: chat_history |
| 5 | Chat Output | Output | None |

---

*Lab: AI Assistant Builder | Use Case: AI Shopping Assistant*  
*Backend: Flowise + OpenRouter | Frontend: HTML + CSS + Vanilla JS*
