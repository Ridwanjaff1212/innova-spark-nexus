# innova-spark-nexus

## 🚀 Overview
- **Project Description**: This project is a comprehensive, feature-rich application designed to streamline the development and deployment process for tech enthusiasts. It leverages modern web technologies and provides a seamless user experience.
- **Key Features**: Real-time collaboration, AI-powered code generation, and a robust API for custom integrations.
- **Who This Project Is For**: Developers, tech enthusiasts, and anyone looking to build and deploy web applications efficiently.

## ✨ Features
- 💻 **Real-time Collaboration**: Seamless collaboration with real-time updates and notifications.
- 🤖 **AI Code Generation**: Automatically generate code snippets and complete projects with AI assistance.
- 📈 **Analytics and Reporting**: Detailed analytics and reporting for project performance and user engagement.
- 🔒 **Security**: Robust security features to protect user data and ensure compliance with industry standards.
- 🌐 **Custom Integrations**: API for custom integrations and third-party services.

## 🛠️ Tech Stack
- **Programming Language**: TypeScript
- **Frameworks, Libraries, and Tools**:
  - **Frontend**: React, Tailwind CSS
  - **Backend**: Node.js, Express.js
  - **Database**: PostgreSQL
  - **Authentication**: JWT
  - **Deployment**: Docker, Kubernetes
  - **Version Control**: Git
  - **Testing**: Jest, Mocha

## 📦 Installation

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Quick Start
```bash
# Step-by-step installation commands
```

### Alternative Installation Methods
- **Package Managers**: Use `npm` or `yarn` to install dependencies.
- **Docker Setup**: Use Docker Compose to set up the development environment.
- **Development Setup**: Follow the instructions in the `README.md` file.

## 🎯 Usage

### Basic Usage
```typescript
// Provide clear, working examples
```

### Advanced Usage
- More complex examples
- Configuration options
- API documentation (if applicable)

## 📁 Project Structure
```
# Show important directories and files
```

## 🔧 Configuration
- **Environment Variables**: `.env` file for environment-specific configurations.
- **Configuration Files**: `config.json` for application settings.
- **Customization Options**: Tailwind CSS for styling and customization.

## 🤝 Contributing
- **How to Contribute**: Follow the guidelines in the `CONTRIBUTING.md` file.
- **Development Setup**: Clone the repository and install dependencies.
- **Code Style Guidelines**: Follow the style guide in the `STYLEGUIDE.md` file.
- **Pull Request Process**: Submit pull requests through the GitHub interface.

## 📝 License
- **License Information**: This project is licensed under the MIT License.

## 👥 Authors & Contributors
- **Project Maintainers**: [Your Name]
- **Acknowledgments**: Thank you to the open-source community for their contributions.

## 🐛 Issues & Support
- **How to Report Issues**: Use the GitHub Issues tab to report bugs and feature requests.
- **Where to Get Help**: Join the community forums or contact the maintainers directly.
- **FAQ**: Frequently asked questions and answers.

## 🗺️ Roadmap
- **Planned Features**:
  - Feature 1: Detailed analytics dashboard
  - Feature 2: Enhanced AI code generation
  - Feature 3: Customizable notification system
- **Known Issues**: List of known issues and their status.
- **Future Improvements**: Upcoming features and improvements.

---

**Additional Guidelines:**
- Use modern markdown features (badges, collapsible sections, etc.)
- Include practical, working code examples
- Make it visually appealing with appropriate emojis
- Ensure all code snippets are syntactically correct for TypeScript
- Include relevant badges (build status, version, license, etc.)
- Make installation instructions copy-pasteable
- Focus on clarity and developer experience
# **Technical Documentation: Innova-Spark-Nexus**

---

## **1. Project Overview**
### **Description**
Innova-Spark-Nexus is a **React-based web application** built with **TypeScript**, **Vite**, and **shadcn/ui** for UI components. It serves as a **platform for ICSK Khaitan Techno Club 2025**, providing features like:
- **AI-powered chatbot** (TechnoBot)
- **Project management** (upload, collaboration, comments)
- **Creative and coding hubs** (AI-generated images, code assistance)
- **Team management & achievements**
- **Event and assignment tracking**

### **Tech Stack**
| Category       | Technologies Used                                                                 |
|----------------|--------------------------------------------------------------------------------|
| **Frontend**   | React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Radix UI      |
| **State Mgmt** | React Query, Zustand (indirectly via shadcn/ui)                                 |
| **AI/ML**      | Supabase Edge Functions (Deno), Lovable AI Gateway (Gemini 2.5)                |
| **Database**   | Supabase (PostgreSQL)                                                           |
| **Authentication** | Supabase Auth                                                                  |
| **UI Components** | Radix UI, Lucide Icons, Embla Carousel, Date-fns, React Hook Form            |
| **Build Tools** | ESLint, Prettier, PostCSS, Vite                                               |

---

## **2. Project Structure**
```
innova-spark-nexus/
├── .env                     # Environment variables
├── .gitignore               # Git ignore rules
├── index.html               # Entry HTML file
├── package.json             # Project dependencies & scripts
├── package-lock.json        # Locked dependency versions
├── public/                  # Static assets
│   └── robots.txt           # SEO & crawling rules
├── src/
│   ├── assets/              # Static assets (images, logos)
│   ├── components/          # Reusable UI components
│   │   ├── ai/              # AI-related components (chatbot, image generator)
│   │   ├── ui/              # shadcn/ui components (buttons, cards, etc.)
│   │   └── ...              # Other components (NavLink, LoadingScreen, etc.)
│   ├── contexts/            # React context providers (AuthContext)
│   ├── hooks/               # Custom React hooks (use-toast, useAuth)
│   ├── integrations/        # External integrations (Supabase client)
│   ├── lib/                 # Utility functions (utils.ts)
│   ├── pages/               # Page components (Dashboard, Projects, etc.)
│   ├── App.css              # Global CSS
│   ├── App.tsx              # Main App component
│   └── index.css            # Tailwind CSS entry point
├── supabase/                # Supabase functions (AI endpoints)
│   ├── functions/           # Deno serverless functions
│   │   ├── ai-chat/         # Chatbot API
│   │   ├── ai-code/         # Code assistance API
│   │   ├── ai-image/        # Image generation API
│   │   └── send-assignment-email/ # Email notifications
│   └── ...
├── vite.config.ts           # Vite configuration
├── tsconfig.*               # TypeScript config files
└── ...
```

---

## **3. Setup & Installation**
### **Prerequisites**
- **Node.js** (v18+ recommended)
- **npm** or **yarn** (v7+ recommended)
- **Supabase account** (for database & auth)
- **Lovable AI API Key** (for AI functionality)

### **Installation Steps**
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd innova-spark-nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   VITE_SUPABASE_PROJECT_ID="your-supabase-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-publishable-key"
   VITE_SUPABASE_URL="https://your-project-url.supabase.co"
   LOVABLE_API_KEY="your-lovable-api-key"  # For Supabase functions
   RESEND_API_KEY="your-resend-api-key"    # For email notifications
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:8080`.

---

## **4. Key Features & Implementation**
### **4.1 AI Chatbot (TechnoBot)**
- **Endpoint**: `/functions/v1/ai-chat`
- **Functionality**:
  - Uses **Gemini 2.5** (via Lovable AI Gateway) for conversational AI.
  - Supports **real-time streaming** for chat responses.
  - Custom system prompts for **TechnoVista-specific** responses.
- **Implementation**:
  ```tsx
  // src/components/AIChatbot.tsx
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  const sendMessage = async () => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
    });

    // Stream response for real-time typing effect
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      // Update UI with partial responses
    }
  };
  ```

### **4.2 AI Image Generator**
- **Endpoint**: `/functions/v1/ai-image`
- **Functionality**:
  - Generates images from text prompts using **Gemini 2.5 Flash**.
  - Returns a **URL** to the generated image.
- **Implementation**:
  ```tsx
  // src/components/ai/ImageGenerator.tsx
  const generateImage = async () => {
    const response = await fetch(IMAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ prompt: prompt.trim() }),
    });

    const data = await response.json();
    setGeneratedImage(data.imageUrl);
  };
  ```

### **4.3 Project Management**
- **Features**:
  - **Upload & share projects**
  - **Real-time comments** (via Supabase Realtime)
  - **Collaboration tools** (AI-assisted code reviews)
- **Implementation**:
  ```tsx
  // src/components/ProjectComments.tsx
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_comments', filter: `project_id=eq.${projectId}` }, async (payload) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", payload.new.user_id)
          .single();

        setComments(prev => [...prev, { ...payload.new, profile }]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [projectId]);
  ```

### **4.4 Authentication & Supabase Integration**
- **Supabase Client**:
  ```ts
  // src/integrations/supabase/client.ts
  import { createClient } from '@supabase/supabase-js';

  export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { autoRefreshToken: true, persistSession: true },
    }
  );
  ```
- **Auth Context**:
  ```tsx
  // src/contexts/AuthContext.tsx
  export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const { data: { user: authUser }, error } = supabase.auth.getUser();
      if (authUser) setUser(authUser);
      setLoading(false);
    }, []);

    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
  };
  ```

### **4.5 UI Components (shadcn/ui)**
- **Customizable components** (buttons, cards, modals) built with **Radix UI** and styled with **Tailwind CSS**.
- **Example: Button Component**:
  ```tsx
  // src/components/ui/button.tsx
  const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          outline: "border border-input bg-transparent hover:bg-accent/10",
          // ... other variants
        },
      },
    }
  );
  ```

---

## **5. Database Schema (Supabase)**
### **Key Tables**
| Table            | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `users`          | Stores user authentication data (Supabase-managed)                         |
| `profiles`       | User profiles (name, avatar, bio)                                           |
| `projects`       | Project metadata (title, description, owner, tags)                           |
| `project_comments` | Comments on projects (user_id, project_id, content, created_at)           |
| `assignments`    | Assignments for students (title, description, deadline, priority)          |
| `assignment_completions` | Tracks assignment completion status (user_id, assignment_id, completed_at) |
| `announcements`  | Club announcements & competitions                                           |
| `teams`          | Teams for collaborative projects                                            |

### **Example Query (Fetching Projects)**
```ts
// src/hooks/useProjects.ts
export const useProjects = () => {
  const { data: projects, refetch } = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return { projects, refetch };
};
```

---

## **6. Configuration**
### **6.1 Tailwind CSS**
- **Custom Theme**: Vine-inspired color palette (`--gold`, `--vine`, `--cream`).
- **Dark Mode**: Supports both system and manual toggling.
- **Example**:
  ```ts
  // tailwind.config.ts
  export default {
    darkMode: ["class"],
    theme: {
      extend: {
        colors: {
          gold: "hsl(45, 76%, 59%)",
          vine: "hsl(85, 30%, 45%)",
          cream: "hsl(45, 30%, 97%)",
        },
      },
    },
  };
  ```

### **6.2 ESLint & TypeScript**
- **ESLint Config**:
  ```js
  // eslint.config.js
  import tseslint from "typescript-eslint";

  export default tseslint.config(
    { ignores: ["dist"] },
    {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      rules: {
        "@typescript-eslint/no-unused-vars": "off", // Disabled for flexibility
      },
    }
  );
  ```
- **TypeScript Config**:
  ```json
  // tsconfig.app.json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "ESNext",
      "strict": false, // Loose for rapid development
      "skipLibCheck": true,
      "paths": { "@/*": ["./src/*"] }
    }
  }
  ```

---

## **7. Development Guidelines**
### **7.1 Coding Standards**
1. **TypeScript**: Use interfaces/types for all props and state.
2. **Component Structure**:
   - **Small, focused components** (single responsibility).
   - **Memoization** for expensive computations (`useMemo`, `React.memo`).
3. **State Management**:
   - **React Query** for data fetching/caching.
   - **Local state** for UI-specific logic (e.g., modals).
4. **AI Prompts**:
   - Keep system prompts **specific** to TechnoVista’s use case.
   - Example:
     ```ts
     // supabase/functions/ai-chat/index.ts
     const systemPrompt = `You are TechnoBot 🤖, an AI assistant for TechnoVista. Help students with coding, project ideas, and club navigation.`;
     ```

### **7.2 Testing**
- **Unit Tests**: Use **Jest** (not shown in repo but recommended).
- **Integration Tests**: Test API endpoints (Supabase functions).
- **UI Tests**: **Cypress** or **Testing Library** for React components.

### **7.3 Performance**
- **Lazy Loading**: Use `React.lazy` for heavy components.
- **Code Splitting**: Vite handles this by default.
- **Optimized Images**: Use `next/image` or `react-image` for large assets.

---

## **8. Deployment**
### **8.1 Frontend Deployment (Vercel/Netlify)**
1. **Build the app**:
   ```bash
   npm run build
   ```
2. **Deploy**:
   - **Vercel**:
     ```bash
     vercel --prod
     ```
   - **Netlify**:
     Drag & drop the `dist` folder to Netlify.

### **8.2 Backend (Supabase Functions)**
1. **Deploy Supabase Functions**:
   ```bash
   supabase functions deploy
   ```
2. **Environment Variables**:
   - Set `LOVABLE_API_KEY` and `RESEND_API_KEY` in Supabase project settings.

### **8.3 CI/CD (GitHub Actions)**
Example workflow for automated testing/deployment:
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist
      - uses: chrnorm/deploy-to-vercel@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## **9. Troubleshooting**
| Issue                          | Solution                                                                 |
|--------------------------------|--------------------------------------------------------------------------|
| **AI API rate limits**         | Check Lovable API usage and retry with exponential backoff.              |
| **Supabase realtime errors**   | Verify channel subscriptions and permissions in Supabase dashboard.       |
| **TypeScript errors**          | Run `npm run lint` to fix ESLint/TS issues.                              |
| **Vite build failures**        | Clear cache (`npm run clean`) and check `vite.config.ts` for typos.      |
| **Dark mode not working**      | Ensure `darkMode: ["class"]` in `tailwind.config.ts` and `className="dark"` in HTML. |

---

## **10. Roadmap & Future Improvements**
| Feature                          | Description                                                                 |
|----------------------------------|-----------------------------------------------------------------------------|
| **User Analytics**               | Track project engagement and AI usage.                                     |
| **Advanced Code Editor**         | Integrate Monaco Editor for real-time code collaboration.                   |
| **Multi-language Support**       | Add language detection for AI responses.                                    |
| **Mobile App**                   | Convert to React Native or Flutter.                                        |
| **Plugin System**                | Allow custom AI models via plugins.                                        |

---

## **11. Contributing**
### **How to Contribute**
1. **Fork the repository**.
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
3. **Commit changes**:
   ```bash
   git commit -m "Add: new AI feature"
   ```
4. **Push to branch**:
   ```bash
   git push origin feature/your-feature
   ```
5. **Open a Pull Request**.

### **Code Review Guidelines**
- **Keep PRs focused** (1 feature per PR).
- **Add tests** for new functionality.
- **Update documentation** if APIs or components change.

---

## **12. License**
This project is licensed under **MIT**. See `LICENSE` for details.

---
**End of Documentation** 🚀
For further questions, contact the maintainers or open an issue in the repository.
