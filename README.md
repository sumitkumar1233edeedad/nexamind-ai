# NexaMind AI 🧠

NexaMind is an advanced, AI-powered conversational platform built with **Django**, **LangChain**, and **LangGraph**, using **OpenRouter (`openai/gpt-4o-mini`)** and tool augmentation including **Tavily Web Search** and **Mathematical Calculation**.

---

## 🚀 Key Features

- **LangGraph ReAct Agent**: Autonomous reasoning and tool orchestration with native LangGraph `StateGraph`.
- **OpenRouter LLM Integration**: Uses `openai/gpt-4o-mini` with low latency and high reasoning accuracy via LangChain's `ChatOpenAI`.
- **Live Web Search**: Powered by Tavily (`TAVILY_API_KEY`) for real-time facts, current news, and markdown-cited sources.
- **Accurate Mathematical Engine**: Built-in calculator tool capable of evaluating complex arithmetic, trigonometric, and logarithmic expressions with 100% precision.
- **Real-Time Date & Time Awareness**: Automatic local and UTC time detection for temporal queries.
- **Conversational Memory**: Multi-turn context preservation across chats.
- **Modern Dark UI**: Glassmorphism aesthetic, sidebar navigation, real-time typing indicators, and quick-prompt suggestion chips.
- **Markdown & Code Rendering**: Safe sanitization with Bleach and rich syntax highlighting.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.12+, Django 6
- **AI / Agentic Framework**: LangChain, LangGraph, LangChain-OpenAI
- **Tools**: Tavily Python SDK (`tavily-python`), Python Math Engine
- **Database**: SQLite (Development) / PostgreSQL-compatible
- **Frontend**: Vanilla HTML5, Modern CSS3 with Custom Properties, JavaScript (ES6+), FontAwesome

---

## ⚙️ Environment Variables (.env)

Create a `.env` file in the root directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

---

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sumitkumar1233edeedad/NexaMind.git
   cd NexaMind
   ```

2. **Create and activate a virtual environment**:
   - Windows:
     ```bash
     python -m venv env
     env\Scripts\activate
     ```
   - macOS / Linux:
     ```bash
     python3 -m venv env
     source env/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Apply database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

6. Open your browser and visit: `http://127.0.0.1:8000/`

---

## 🧪 CLI Testing

You can also run the standalone agent CLI to test search and calculation tools directly:

```bash
python NexaMind/api.py
```

---

## 📄 License

This project is licensed under the MIT License.
