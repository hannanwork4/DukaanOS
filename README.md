# DukaanOS — Voice-First Business Operating System

> **A business operating system for independent Indian kirana stores and small retail shops, operated through Claude via the Model Context Protocol (MCP).**

---

## 1. Product Vision & Architecture

Traditional kirana shopkeepers manage their businesses with notebooks, memory, and mental math. DukaanOS introduces connected business records where shopkeepers **enter information once, and everything connected to it updates automatically**.

When a shopkeeper speaks to Claude:
> *"I purchased 20 packets of Cooking Oil from Ramesh Traders for ₹2,000. I paid ₹1,000 and the remaining amount is pending."*

Claude invokes the structured DukaanOS MCP tools. DukaanOS deterministically:
1. Adds 20 packets to stock.
2. Logs a purchase of ₹2,000 in the purchase book.
3. Records ₹1,000 paid upfront in cash-flow records.
4. Records ₹1,000 pending liability under Ramesh Traders' ledger.
5. Updates the product's purchase cost.
6. Refreshes shop overview metrics and deterministic business insights.
7. Displays the purchase in the unified transaction history.

### Strict Assignment Constraints Compliance
- **No AI Model or API inside DukaanOS**: Zero OpenAI, Gemini, or Anthropic keys inside the application codebase.
- **Claude handles interpretation**: Claude acts as the intelligent operator interpreting user intent and choosing structured MCP tools.
- **DukaanOS manages records & deterministic math**: Pure deterministic accounting, inventory math, relational integrity, and UI state.
- **Fully editable**: Any record created by Claude can be viewed, edited, or reversed directly by a person in the DukaanOS web interface.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js 22+, Express, TypeScript, Zod schema validation.
- **Database**: 
  - **Supabase PostgreSQL** for production deployment (DDL schema & seed data provided in `supabase/schema.sql` and `supabase/seed.sql`).
  - **LocalStore Engine** (ACID file-based relational store) for zero-config localhost testing without credentials.
- **MCP Server**: Official TypeScript MCP SDK (`@modelcontextprotocol/sdk`) implementing both **Streamable HTTP (Server-Sent Events / SSE)** and **stdio** transports.

---

## 3. Project Structure

```
DukaanOS/
  ├── client/               # React + Vite + Tailwind frontend application
  │   ├── src/
  │   │   ├── api/          # Typed API client
  │   │   ├── components/   # Layout, Modal, ConfirmDialog, Toast, TrendChart
  │   │   ├── pages/        # Dashboard, Inventory, Purchases, Sales, Suppliers, Expenses, Transactions, Insights, Settings
  │   │   ├── App.tsx
  │   │   └── main.tsx
  │   └── package.json
  ├── server/               # Express API and core business logic
  │   ├── src/
  │   │   ├── db/           # Database layer (Supabase PostgreSQL & LocalStore)
  │   │   ├── routes/       # REST API endpoints for all modules
  │   │   ├── services/     # Inventory, Purchase, Sale, Supplier, Expense, Ledger, Insights services
  │   │   ├── index.ts      # HTTP server on port 4000
  │   │   └── types.ts      # Domain models
  │   ├── test/             # Automated test suites (API, Demo workflow, Full system)
  │   └── package.json
  ├── mcp/                  # Official TypeScript MCP Server
  │   ├── src/
  │   │   ├── tools.ts      # All 18 registered MCP tools
  │   │   ├── apiClient.ts  # Typed API bridge to DukaanOS backend
  │   │   ├── index.ts      # Remote MCP Streamable HTTP / SSE transport (port 4001)
  │   │   └── stdio.ts      # Claude Desktop stdio transport
  │   └── package.json
  ├── supabase/
  │   ├── schema.sql        # Full PostgreSQL DDL (tables, RLS, indexes, constraints)
  │   └── seed.sql          # Realistic seed records for Indian kirana store
  ├── .env.example          # Environment variable template
  ├── package.json          # Root scripts
  └── README.md
```

---

## 4. Local Installation & Quickstart

### Prerequisites
- Node.js 18+ (Node 22 or 24 recommended)
- npm 10+

### Step 1: Install Dependencies
From the repository root:
```bash
# Install root dependencies
npm install

# Install server, mcp, and client dependencies
npm --prefix server install
npm --prefix mcp install
npm --prefix client install
```

### Step 2: Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

*(By default, DukaanOS uses its built-in persistent LocalStore, allowing full local execution with zero third-party account requirements! To connect Supabase, simply paste your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`.)*

### Step 3: Run the Application
You can run all three services concurrently:
```bash
npm run dev
```

Or run them individually in separate terminal windows:
```bash
# Terminal 1: Backend API (Port 4000)
npm --prefix server run dev

# Terminal 2: MCP Server (Port 4001)
npm --prefix mcp run dev

# Terminal 3: Frontend Client (Port 5173)
npm --prefix client run dev
```

Open **http://localhost:5173** in your browser.

---

## 5. Connecting Claude to DukaanOS via MCP

### Option A: Remote MCP over Streamable HTTP / SSE (Recommended)
The DukaanOS MCP server serves a Claude-compatible remote transport at:
- **SSE Endpoint**: `http://localhost:4001/sse`
- **Messages Endpoint**: `http://localhost:4001/messages`

When using an MCP-compatible remote host or custom connector, point the MCP URL to:
```
http://localhost:4001/sse
```

### Option B: Claude Desktop Configuration (stdio)
Open your Claude Desktop configuration file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the `dukaanos` server definition:
```json
{
  "mcpServers": {
    "dukaanos": {
      "command": "node",
      "args": [
        "C:\\Users\\DELL\\Desktop\\DukaanOS\\mcp\\dist\\stdio.js"
      ],
      "env": {
        "API_URL": "http://localhost:4000"
      }
    }
  }
}
```

Build the MCP server once so `dist/stdio.js` is generated:
```bash
npm --prefix mcp run build
```
Restart Claude Desktop. The hammer tool icon will now display the 18 DukaanOS tools.

---

## 6. Complete List of 18 MCP Tools

| # | Tool Name | Description |
|---|---|---|
| 1 | `add_product` | Add a new product with selling price, unit, and minimum safety threshold. |
| 2 | `list_products` | List all inventory products with stock levels, cost, selling price, and stock value. |
| 3 | `update_product` | Update pricing, minimum stock thresholds, or product names. |
| 4 | `get_low_stock_products` | Return all items currently at or below their safety threshold. |
| 5 | `add_supplier` | Register a new supplier with contact number and business address. |
| 6 | `list_suppliers` | List registered suppliers with total purchases and outstanding dues. |
| 7 | `get_supplier_balance` | Check current balance, purchases, and settlement history for a supplier. |
| 8 | `record_purchase` | Restock goods: increments inventory, updates supplier dues, logs payment. |
| 9 | `list_purchases` | List purchase book entries with line items and payment status. |
| 10 | `update_purchase` | Safely reverses old inventory & supplier effects and reapplies revised values. |
| 11 | `record_sale` | Decrements stock, logs revenue, and calculates estimated gross profit. |
| 12 | `list_sales` | List sales history with items sold, revenue, and gross profit margins. |
| 13 | `record_expense` | Log operational overheads (Electricity, Rent, Transport, Wages, etc.). |
| 14 | `list_expenses` | List overhead expenses filtered by category or date. |
| 15 | `record_supplier_payment` | Clear supplier dues without creating duplicate purchase expenses. |
| 16 | `get_dashboard_summary` | Real-time overview of today's sales, purchases, dues, and stock valuation. |
| 17 | `get_business_insights` | 100% deterministic insights on low stock, capital lockup, and margins. |
| 18 | `get_inventory_summary` | Summary of total SKUs, total units, valuation, and category breakdown. |

---

## 7. Official 5-Step Demo Workflow

The demo follows this exact sequence:

### Step 1 — Claude Setup
Tell Claude:
> *"Add a new supplier called Ramesh Traders. Add a product called Cooking Oil with a selling price of ₹130 and minimum stock of 5 packets."*
- Claude calls `add_supplier` (`name: "Ramesh Traders"`).
- Claude calls `add_product` (`name: "Cooking Oil"`, `selling_price: 130`, `min_stock_threshold: 5`).

### Step 2 — Purchase Restock
Tell Claude:
> *"I purchased 20 packets of Cooking Oil from Ramesh Traders for ₹2,000. I paid ₹1,000 and the remaining amount is pending."*
- Claude calls `record_purchase` with supplier Ramesh Traders, 20 packets @ ₹100, amount_paid: 1000.

### Step 3 — Verify the App
Open DukaanOS at `http://localhost:5173`:
- **Inventory**: Cooking Oil stock is now **20 packets**.
- **Purchases**: Purchase book shows **₹2,000**.
- **Suppliers**: Ramesh Traders shows **₹1,000 outstanding balance**.
- **Dashboard**: Today's purchases show **₹2,000**, supplier dues show **₹1,000**.

### Step 4 — Record a Sale
Tell Claude:
> *"I sold 5 packets of Cooking Oil for ₹650 through UPI."*
- Claude calls `record_sale` (5 packets @ ₹130).
- DukaanOS updates:
  - Inventory decrements from **20 to 15 packets**.
  - Sales increase by **₹650**.
  - Estimated gross profit computed: **₹150** (Revenue ₹650 - Cost 5 * ₹100).

### Step 5 — Human Edit in DukaanOS UI
Open DukaanOS, navigate to **Purchases**, click the edit icon on the purchase, and change quantity from 20 to 25 packets (paid ₹1,500).
- DukaanOS automatically reverses the previous stock (-20) and adds the new quantity (+25).
- Stock becomes **20 packets** (25 purchased - 5 sold).
- Supplier balance updates accurately to **₹1,000** (₹2,500 total - ₹1,500 paid).

---

## 8. Verification & Automated Tests

Run the complete test suite:
```bash
# 1. Core business logic & database integrity tests (15 test suites)
npm --prefix server run test

# 2. Official 5-step demo workflow verification test
npm --prefix server run test:demo

# 3. Full system end-to-end integration test (API + Remote MCP SSE + Client)
npm --prefix mcp run test
```
All tests execute deterministically and verify stock safeguards, reversal arithmetic, and balance integrity.

---

## 9. Production Deployment Guide

### Database (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run `supabase/schema.sql`.
4. (Optional) Paste and run `supabase/seed.sql` to populate sample data.
5. In Project Settings > API, copy `Project URL` and `service_role key`.

### Backend & MCP Server (Render / Railway)
1. Push this repository to GitHub.
2. In Render or Railway, create a new Web Service pointing to the repository.
3. Root Directory: `server` (or `mcp`).
4. Build Command: `npm install && npm run build`.
5. Start Command: `npm start`.
6. Environment Variables:
   - `PORT`: `4000` (or `4001`)
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret
   - `DEFAULT_BUSINESS_ID`: `b0000000-0000-0000-0000-000000000001`

### Frontend (Vercel)
1. Import the repository in Vercel.
2. Root Directory: `client`.
3. Framework Preset: `Vite`.
4. Build Command: `npm run build`.
5. Environment Variable:
   - `VITE_API_URL`: URL of the deployed backend server.

