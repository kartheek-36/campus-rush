# Campus Rush 🚀

Campus Rush is a modern, decentralized, AI-enhanced campus ecosystem platform designed to streamline student activities, marketplace transactions, event management, and campus services.

---

## 📁 Project Structure

```text
campus-rush/
├── frontend/        # Web & mobile user interfaces (React/Next.js or Vue)
├── backend/         # Core REST / GraphQL API server & business logic (Node.js/Go/Python)
├── ai-service/      # AI/ML models, recommendation engines & intelligent agents (Python/FastAPI)
├── blockchain/      # Smart contracts, Web3 integrations & tokenomics (Solidity/Hardhat)
├── database/        # Database schemas, migrations, seed data & configuration (SQL/NoSQL)
└── README.md        # Main project documentation and getting started guide
```

---

## 🛠️ Architecture & Modules

### 1. `frontend/`
- **Purpose**: Client-side application for students, faculty, and administrators.
- **Key Responsibilities**:
  - Interactive dashboards, campus feeds, and marketplace UI
  - Web3 wallet connection & transaction confirmation
  - AI chat assistants and campus prediction tools

### 2. `backend/`
- **Purpose**: Core application server handling authentication, business logic, and API orchestration.
- **Key Responsibilities**:
  - User management, authentication (JWT/OAuth), and authorization
  - Campus events, bookings, and notifications
  - Interfacing between database, blockchain nodes, and AI microservices

### 3. `ai-service/`
- **Purpose**: Microservice dedicated to AI/ML features.
- **Key Responsibilities**:
  - Campus prediction experiments
  - Automated moderation for campus posts and reviews
  - Intelligent search and smart matching

### 4. `blockchain/`
- **Purpose**: Decentralized layer for verified credentials, tokenized rewards, and campus transactions.
- **Key Responsibilities**:
  - Smart contracts (e.g., student reputation tokens, event ticketing, NFT badges)
  - Deployment scripts and contract tests
  - Web3 provider integrations

### 5. `database/`
- **Purpose**: Data storage, migrations, and initialization scripts.
- **Key Responsibilities**:
  - Schema definitions (PostgreSQL / MongoDB)
  - Data migration scripts and seeds
  - Cache configurations (Redis)

---

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd campus-rush
   ```

2. **Navigate to the respective module** to setup dependencies and run services:
   ```bash
   # Example: Running frontend
   cd frontend
   npm install
   npm run dev
   ```

---

## 📄 License
MIT License
