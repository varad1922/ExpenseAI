# ExpenseAI – Smart Personal Finance & Budget Management System

> **Track. Analyze. Predict. Save Smarter.**

ExpenseAI is a premium, smart personal finance and budget planning web application. It integrates custom tracking algorithms and AI-powered intelligence to scan receipt images, analyze spending patterns, provide saving recommendations, generate standard budgets, and offer a real-time advisory chat panel.

---

## 🌟 Core Features

### 1. User Account Portal
* Secure account registration and login session validation.
* JWT Authentication securely stored client-side.
* Simulator for forgot password recovery.

### 2. Income & Expense Ledgers
* Full CRUD (Create, Read, Update, Delete) capability on cash transactions.
* Advanced text queries matching notes, category, or descriptions.
* Category filter toggles and start-end date range boundaries.
* Dynamic sorting of columns and paginated scrolling list.

### 3. Smart Budget Planner
* Set overall total monthly budget limits or specific category limits.
* Real-time budget progress bar indicators (green for safe, yellow/gold warning for >80%, flashing coral for over-limits).
* Automated notifications triggered in real-time when transaction entry breaches limits.

### 4. AI-Powered Advisory Suite
* **AI Chatbot**: Contextual chat panel injected with your real-time transactions, category budgets, and status. Quick chips for immediate financial audits.
* **AI Receipt Scanner**: Vision-assisted extraction of store merchant, billing total, purchase date, line items, and category suggestion. *Automatically records the expense on success.*
* **AI Spending Analysis**: Clear summaries of savings rates and categorized expenditures.
* **AI Savings Suggestions**: Personalised recommendations showing exactly where and how much you can save.
* **AI Budget Generator**: Instantly split your salary into recommended categories using the 50/30/20 standard and apply them to active targets with one click.
* **AI Financial Health Score**: 0-100 score indicating your current safety rating, detailing strengths and needs improvement.

### 5. Statement Export Centers
* Export custom ledger statements directly as structured Excel-ready **CSV spreadsheets**.
* Export statements as styled, print-ready financial **PDF documents**.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, CSS3, Vanilla JavaScript (Obsidian Gold theme, Glassmorphism, CSS Grid/Flexbox), Chart.js (Data Visualisation), FontAwesome (Iconsets).
* **Backend**: Node.js, Express.js, JWT, bcryptjs, Multer (File upload handlers), Express Validator, Morgan, PDFKit (PDF statement builds).
* **Database**: MongoDB & Mongoose.
* **AI Engine**: OpenAI API (GPT-4o-mini). *Includes a fallback mock parser when an API key is absent for local offline testing.*

---

## 📂 Project Structure

```
ExpenseAI/
├── backend/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/
│   │   ├── authController.js   # Auth business logic
│   │   ├── expenseController.js# Expense actions
│   │   ├── incomeController.js # Income actions
│   │   ├── budgetController.js # Target controls
│   │   ├── notificationController.js # Alerts
│   │   ├── aiController.js     # Cognitive systems
│   │   └── reportController.js # File printing
│   ├── middleware/
│   │   ├── auth.js             # JWT verifier
│   │   ├── upload.js           # Multer uploads
│   │   └── errorHandler.js     # Errors catcher
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   ├── Income.js
│   │   ├── Budget.js
│   │   ├── Notification.js
│   │   └── AIHistory.js
│   ├── routes/                 # Express endpoint mounts
│   ├── services/
│   │   └── aiService.js        # OpenAI / Fallback rules
│   ├── uploads/                # Receipts directory
│   ├── validations/
│   │   └── validators.js       # Input formats
│   ├── app.js
│   └── server.js
├── frontend/
│   ├── css/
│   │   ├── auth.css            # Authentication styling
│   │   └── styles.css          # Main Dashboard stylesheet
│   ├── html/
│   │   ├── login.html
│   │   ├── register.html
│   │   └── index.html          # SPA interface
│   └── js/                     # Client controllers
└── README.md
```

---

## 🚀 Setup & Installation Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) installed (v16+ recommended).
* [MongoDB](https://www.mongodb.com/) running locally, or a MongoDB Atlas URI connection link.

### 1. Clone & Install Dependencies
Navigate to the root directory and install dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root workspace directory and fill in the details:
```env
PORT=5000
MONGO_URI=mongodb+srv://varadshahane929_db_user:varad1922@cluster0.tkkzzsp.mongodb.net/expenseai?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=super_secret_expenseai_jwt_token_key_12345
OPENAI_API_KEY=your_openai_api_key_here
```
*(Note: If `OPENAI_API_KEY` is not provided or remains a placeholder, the app will execute locally computed mock AI rules matching your actual transaction values so you can still test receipt uploading, chat sessions, and insights offline!)*

### 3. Start the Server
Run the local Node dev server:
```bash
node backend/server.js
```
The server will boot on port `5000`. Open your browser and navigate to:
```
http://localhost:5000
```
This will automatically launch the **Login Panel** where you can create a test account and explore your smart wealth dashboard.
