# SLUSHIE LAB // vessel-69
A localized cyber-vortex simulation for atmospheric slushie generation. Built with Flask, vanilla JS, and a terminal-inspired UI.
A high-atmosphere, terminal-inspired slushie simulation and order management system. 

## 🛠 TECH SPECS
* **Backend:** Python 3.12 / Flask
* **Frontend:** HTML5, CSS3 (Vessel Dark Theme), Vanilla JavaScript
* **Environment:** Optimized for Ubuntu 24.04 (Noble)
* **Architecture:** PRG Pattern (Post/Redirect/Get) for seamless order processing

## 📂 PROJECT MAP
* `app.py` — The Flask engine.
* `templates/` — HTML structures (Home, About, Order).
* `static/` — The CSS styling and Roulette logic.
* `.gitignore` — Ensuring local environments stay private.

## 🛠 THE VESSEL BUILD LOG
This project was developed and deployed using a manual Linux workflow to ensure full control over the environment and security.

* **Environment:** Ubuntu 24.04 LTS (Noble Numbat)
* **Version Control:** Manual Git initialization and CLI-based staging.
* **Security:** Authentication handled via GitHub Personal Access Tokens (Classic) to bypass deprecated password protocols.
* **Deployment:** Configured via `vercel.json` and synced through a GitHub-to-Vercel CI/CD pipeline.
* **Structure:** Custom Flask architecture with manual asset routing for `static/` and `templates/`.

## ✨ KEY FEATURES
* **Interactive Slushie Wheel:** Physics-based roulette for flavor selection.
* **Smart Receipts:** Dynamic generation of order details with custom styling.
* **Persistent Session Handling:** Data integrity maintained across refreshes (PRG Pattern).
* **UI:** Atmospheric dark mode optimized for terminal enthusiasts.

## 🚀 LOCAL DEPLOYMENT
To initialize the lab on your local machine:

1. **Clone the repository:** 
   (Bash)
   git clone [https://github.com/vessel-69/slushie-lab.git](https://github.com/vessel-69/slushie-lab.git) 
   cd "Slushie-Lab"


   Initialize Environment: 
   (Bash)
   python3 -m venv .venv
   source .venv/bin/activate
   pip install flask

   Boot the System: 
   (Bash)
   python3 app.py


> "The plumbing matters as much as the UI." — Vessel_69
