# 🚀 AI CareerForge

AI CareerForge is a state-of-the-art, agentic AI career platform designed to accelerate your job search. By leveraging **Google Gemini AI**, **Vector Search**, and **Agentic RAG workflows**, it provides personalized career tools like resume tailoring, cover letter generation, and interview preparation.

---

## ✨ Features

- **🤖 Agentic RAG Workflows**: Tailor resumes, generate cover letters, and build prep kits specifically for any job description.
- **🔍 Smart Job Matching**: Uses **MongoDB Atlas Vector Search** to semantically match your profile with real-time job listings.
- **💼 Real-time Job Search**: Integrated with the **Adzuna API** to pull live career opportunities globally.
- **📱 Premium UI**: A modern, responsive dashboard built with **Next.js 15**, **TailwindCSS**, and **shadcn/ui**.
- **🔐 Secure Access**: Built-in JWT-based authentication for a personalized and private experience.
- **📄 Document Processing**: Automatically extracts text from uploaded PDF resumes.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Spring Boot 3.3+ (Java 21)
- **AI**: Spring AI with Google Gemini (via OpenAI-compatible endpoint)
- **Database**: MongoDB (Atlas)
- **Vector Search**: MongoDB Atlas Vector Search
- **Security**: Spring Security + JWT
- **Environment**: Dotenv for local variable management

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: React Hooks
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
- **JDK 21**
- **Node.js 20+** & npm
- **MongoDB Atlas Cluster** (with Vector Search enabled)
- **Google AI API Key** (Gemini)
- **Adzuna API Credentials** (App ID and App Key)

---

### 📂 Repository Structure
```
ai-career-forge/
├── ai-career-forge-backend/  # Spring Boot Microservice
└── ai-career-forge-frontend/ # Next.js Application
```

---

### ⚙️ Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd ai-career-forge-backend
   ```

2. **Configure Environment Variables**:
   Create a `.env.development` file in the root of the backend directory:
   ```env
   # Core
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret_key

   # AI Configuration (Gemini)
   GOOGLE_AI_API_KEY=your_gemini_api_key

   # Job API (Adzuna)
   ADZUNA_APP_ID=your_adzuna_id
   ADZUNA_APP_KEY=your_adzuna_key
   ```

3. **Run the Application**:
   ```bash
   mvn clean package -DskipTests
   mvn spring-boot:run
   ```

---

### 🌐 Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ai-career-forge-frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🧭 Vector DB Configuration (MongoDB Atlas)

To enable semantic job matching, you must create a Vector Search Index in your Atlas UI:

1. Create an index named `vector_index` against your `vector_store` collection.
2. Use the following JSON configuration:
   ```json
   {
     "fields": [
       {
         "numDimensions": 768,
         "path": "embedding",
         "similarity": "cosine",
         "type": "vector"
       }
     ]
   }
   ```
> [!NOTE]
> We use **768 dimensions** for Gemini's `text-embedding-004` (or `gemini-embedding-001`) model.

---

## 🚢 Deployment

The project is pre-configured for deployment on platforms like **Render** or **Vercel**.
- **Backend**: Use the provided `Dockerfile` or deploy as a Web Service.
- **Frontend**: Deploy via Vercel for the best Next.js experience.

---

## 🛣️ Roadmap

- [x] Switch from Ollama to Google Gemini for production stability.
- [x] Add `.env` support for backend local development.
- [ ] Implement multi-modal profile analysis.
- [ ] Add direct job application tracking.
- [ ] Enable persistent AWS S3 storage for static assets.

---

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
33333