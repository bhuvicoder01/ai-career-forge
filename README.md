# AI CareerForge

AI CareerForge is an agentic, AI-powered career accelerator. It features a Spring Boot 3 + Java 21 backend and a Next.js 15 App router frontend.

## Features

- **Agentic RAG Workflows**: Uses Spring AI ChatClient to tailor resumes, write cover letters, and generate company-specific interview prep kits.
- **Smart Job Matching**: Uses MongoDB Vector Store to match your embedded skillset to job descriptions.
- **Modern UI**: Built with Next.js 15, TailwindCSS, and shadcn/ui.
- **Microservices-ready**: JWT Authentication.

## Local Setup

### Prerequisites
- JDK 21
- Node.js 20+ & npm
- MongoDB Atlas cluster (with vector search capabilities)
- AWS Account (for S3 bucket)
- OpenAI API Key

### Backend Setup
1. Open the full project folder `ai-career-forge`.
2. Configure `.env.example` as `.env` parameters if running globally, or edit `ai-career-forge-backend/src/main/resources/application.yml` placeholders or export them as shell variables:
   - `MONGODB_URI`
   - `OPENAI_API_KEY`
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_ENDPOINT`
   - `JWT_SECRET`
3. In `ai-career-forge-backend/`, run:
   ```bash
   mvn clean package -DskipTests
   mvn spring-boot:run
   ```

### Frontend Setup
1. In `ai-career-forge-frontend/`, run:
   ```bash
   npm install
   npm run dev
   ```
2. Access the application at `http://localhost:3000`.

## Vector DB Setup Instruction for MongoDB Atlas
1. Follow standard process to configure a Vector Search Index in Atlas.
2. In your Atlas UI, create an index named `vector_index` against your `vector_store` collection. Use vector dimensionality `1536` for OpenAI `text-embedding-3-small` and `cosine` similarity metric.
