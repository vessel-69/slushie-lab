## 🥤 Slushie Lab || vessel-69
> A high-performance, neon-infused flavor roulette for the modern slushie connoisseur.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://slushie-lab.vercel.app/)
[![Engine](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![OS](https://img.shields.io/badge/Ubuntu-Noble-E95420?style=for-the-badge&logo=ubuntu)](https://ubuntu.com/)

---

## ⚡ Features
Welcome to the lab. Here’s what’s under the hood of **VESSEL-69**:

* **🎡 Cyber-Roulette:** A smooth, CSS-animated wheel that decides your destiny.
* **🧪 Dynamic Scaling:** Adjust your quantity (1-100) and watch the UI react.
* **📊 Progress Tracking:** Integrated progress bars that fill as the "machine" prepares your order.
* **🎨 Custom Theming:** Dark-mode optimized with neon accents (Cyan & Lime).
* **📋 Instant Result Copy:** One-click clipboard functionality to share your "Mystery Flavor" result.

---

## 📁 Project Structure

```text
slushie-lab/
├── app.py              # The Flask Brain
├── favicon/            # Web Favicon
├── static/             # The UI Hardware (CSS/JS)
│   ├── style.css       # Neon aesthetics
│   └── roulette.js     # Spin logic
└── templates/          # The Visual Interface (HTML)
    └── index.html      # Main Lab Floor
```

---

## 🕹️ How to Use
1.  **Enter the Lab:** Head to the >> https://slushie-lab.vercel.app/
2.  **Adjust the Specs:** Choose your quantity using the inputs.
3.  **Spin the Wheel:** Click the center of the roulette to begin the flavor extraction.
4.  **Claim your Order:** Once the "Slushie" finishes processing, copy your result and enjoy your virtual slushie!

---

## 🛠️ Local Setup (For Developers)

If you want to run the lab on your own machine (tested on **Ubuntu 24.04.4 LTS**), follow these steps:

### 1. Clone the Lab
```bash
git clone https://github.com/vessel-69/slushie-lab.git
cd slushie-lab
```

### 2. Prepare the Environment
```bash
# Create a virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Launch Slushie Lab
```bash
python3 app.py
```
> Open your browser and navigate to `http://127.0.0.1:5000`

---


## 🛰️ Deployment
This project is continuously deployed via **Vercel**. 
Any push to the `main` branch automatically triggers a new build and update to the live site.

---

**Developed by Vessel-69** 
