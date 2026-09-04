# 📓 Personal Gemini Journal

A secure, AI-powered journaling and mental wellness web application built for the **Google Cloud Run Build & Deploy Social Challenge**. This application integrates Google's Gemini API to provide interactive reflections while strictly adhering to enterprise-grade security and cloud deployment best practices.

**🔗 Live Cloud Run Endpoint:** [View the Live Application](https://personal-gemini-journal-538317365332.asia-southeast1.run.app/)

## ✨ Key Features
*   **Intelligent AI Reflections:** Integrates the Google Gemini API to analyze daily entries and offer supportive, context-aware feedback.
*   **Premium Glassmorphism UI:** Features a calming, modern interface utilizing soft lavender and cyan blue gradients, and a highly polished navigation bar.
*   **Secure Authentication:** Passwordless, federated login powered by Firebase Authentication (Google Sign-In).
*   **Zero-Hardcoded Secrets:** All API keys and environment variables are dynamically fetched at runtime using Google Cloud Secret Manager.

## 🛠️ Architecture & Tech Stack
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript
*   **Backend & Cloud:** Firebase Auth, Cloud Firestore, Google Cloud Run
*   **AI Integration:** Google Gemini API 

## 🔒 Configurations & Firestore Security Rules
The application implements strict database isolation. Every journal entry is bound to the user's authenticated `request.auth.uid`, ensuring complete data privacy.

**Firestore Security Rules Applied:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journalEntries/{document=**} {
      // Only allow read/write if the user is signed in and the document belongs to them
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
