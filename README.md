# 🏙️ CivicSnap

A high-performance Progressive Web App (PWA) designed for community-driven civic issue tracking, real-time mapping, and automated AI validation. Built and optimized during the Vibe2Ship Hackathon.

## 🌐 Live Production Deployment (Google Cloud)
> 🚨 **Mandatory Hackathon Criteria Met** > The application is compiled into production-ready static assets and deployed natively on **Google Cloud Infrastructure** via Firebase Hosting's global Edge network.
> 
> 👉 **[Click Here to View the Live App on Google Cloud](https://civicsnap-402e8.web.app)**

---

## 🚀 Core Features

* **Real-Time Geospatial Mapping:** Utilizes interactive custom Leaflet maps to pinpoint civic infrastructure anomalies, safety hazards, or maintenance issues locally.
* **AI-Powered Validation Engine:** Integrated with **Gemini 2.5 Flash** via Google AI Studio to dynamically filter, validate, and analyze reported data upon submission.
* **Instant Backend Synchronization:** Powered by Google Cloud's Firebase/Firestore real-time ecosystem for instantaneous multi-client updates and state persistence.
* **Admin Command Console:** Secure admin interface providing localized oversight tools to track community queries and filter infrastructure inputs efficiently.

---

## 🛠️ Tech Stack & Architecture

| Component | Technology | Cloud Provider / Host |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, TailwindCSS, Vite | **Google Cloud Platform (GCS/Firebase Edge)** |
| **Database & Auth** | Firebase Auth (Google OAuth) & Firestore | **Google Cloud Global Backend** |
| **AI Processing** | Gemini 2.5 Flash API | **Google AI Studio** |
| **Geospatial Mapping** | Leaflet.js / React-Leaflet | OpenStreetMap Tiles |

---

## 📦 Local Workspace Setup & Build

To run this project locally or inspect the production compilation parameters on your machine:

1. Clone the repository:
   ```bash
   git clone [https://github.com/srijith230907/Vibe2Ship_Hackathon.git](https://github.com/srijith230907/Vibe2Ship_Hackathon.git)
   cd Vibe2Ship_Hackathon/project
