# 📱 RivalQuest  

**Your Goals. Your Rival. Your Journey.**  

RivalQuest is a **gamified habit-tracking app** that transforms daily routines into a competitive journey against your own AI rival.  
Instead of boring to-do lists, RivalQuest motivates you through playful rival challenges, reminders, and progress tracking — making self-improvement more engaging.  

---

## ✨ Features  

- 🎯 **Daily Quests** – Create tasks like “Study 50 min” or “Drink 8 glasses of water.”  
- 🧑‍🤝‍🧑 **AI Rival Motivation** – Your rival reacts when you skip tasks with taunts that push you to act.  
- 📊 **Progress Tracking** – Simple stats and feedback help you stay consistent.  
- 🎨 **Pixel-Inspired UI** – Clean, nostalgic design with a focus on clarity and motivation.  
- 📱 **Cross-Platform** – Runs on web and mobile (via React + Vite frontend).  

---

## 🛠️ Tech Stack  

### ⚡ Frontend  
- **React + TypeScript** – UI framework  
- **Vite** – fast build tool  
- **TailwindCSS** – styling  
- **shadcn/ui** – prebuilt UI components  

### ⚙️ Backend  
- **Python 3.x**  
- **FastAPI** – web framework  
- **Uvicorn** – ASGI server  
- **PostgreSQL** – database  
- **Pydantic** – data validation  
- **asyncpg** – PostgreSQL async driver  

### 🧩 Other Tools  
- **OpenAI API** – AI-powered rival messages  
- **Requests / BeautifulSoup** – data integrations  
- **Yarn (Plug’n’Play)** – dependency management  

---

## 🚀 Getting Started  

### 1. Clone the repository  
```bash
git clone https://github.com/your-username/rivalquest.git
cd rivalquest
2. Frontend Setup
bash
Copy code
cd frontend
yarn install
yarn dev
Runs the React app on http://localhost:5173.

3. Backend Setup
bash
Copy code
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
Runs the FastAPI backend on http://localhost:8000.

🧩 Example Quests
🏋️ Fitness: Go to gym for 1 hour

📚 Study: Read 20 pages

💧 Wellness: Drink 8 glasses of water

🧘 Mindfulness: Meditate for 10 minutes

🌍 SDG Alignment
This project contributes to United Nations SDG 3: Good Health and Well-Being by:

✅ Encouraging physical health (exercise, hydration)

✅ Supporting mental well-being (study, meditation)

✅ Strengthening social habits (connection, accountability)

📈 Roadmap
 🎮 Add XP & progress bar system

 🎭 Add animations & richer rival reactions

 🔔 Implement push notifications

 💎 Expand monetization (cosmetics via IntaSend)

 🌐 Add social features (friends, rival battles)

🤝 Contributing
We’d love your help to improve RivalQuest!

🍴 Fork the repo

🌱 Create a feature branch

💻 Commit your changes

🚀 Open a Pull Request

📜 License
MIT License © 2025 RivalQuest

