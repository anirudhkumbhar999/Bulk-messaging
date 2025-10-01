````markdown
# Mesaanger - Modern Messaging App 📱

Mesaanger is a modern messaging application built with **React Native** and **Expo**, designed to provide a seamless communication experience across platforms.

---

## 🚀 Project Setup

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd Mesaanger
````

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure environment variables**

   * Copy `.env.example` to `.env` and fill in your Supabase credentials:

     ```sh
     cp .env.example .env
     # Edit .env and set:
     # EXPO_PUBLIC_SUPABASE_URL=<your-url>
     # EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
     ```

4. **Start the development server**

   ```sh
   npm start
   ```

5. **Open the app**

   * Scan the QR code with **Expo Go** (Android/iOS), or
   * Run on an **emulator/simulator**.

> ⚠️ **Note:**
>
> * If you see errors about Node.js modules (like `ws` or `stream`), see the [Expo/React Native Compatibility Notes](#-exporreact-native-compatibility-notes).
> * Do **not** use Supabase real-time features in Expo Go.

---

## ✨ Features

* 🔐 Secure Authentication System
* 👤 User Profile Management
* 💬 Real-time Messaging *(Coming Soon)*
* 🎨 Modern UI/UX Design
* 📱 Cross-platform Support

---

## 🛠 Tech Stack

* [Expo](https://expo.dev) – React Native development framework
* [Expo Router](https://docs.expo.dev/router/introduction) – File-based routing
* [React Native](https://reactnative.dev) – Cross-platform UI development
* [TypeScript](https://www.typescriptlang.org/) – Type-safe development

---

## 🏁 Getting Started

1. Clone the repository
2. Install dependencies

   ```bash
   npm install
   ```
3. Start the development server

   ```bash
   npx expo start
   ```
4. Open the app in your preferred environment:

   * 📱 iOS Simulator
   * 🤖 Android Emulator
   * 📷 Expo Go on your physical device

---

## ⚡ Expo/React Native Compatibility Notes

This project uses **Supabase** with Expo. Some Node.js-only modules (like `ws` and `stream`) are **not supported** in React Native, so we use **shims** and Metro configuration workarounds:

* `ws-shim.js` and `stream-shim.js` → Empty modules to prevent bundling errors
* `metro.config.js` → Configured to alias `'ws'` and `'stream'` to the shims

> 🔑 **Important:**
>
> * Do **not** use Supabase real-time features (`channels`, `subscriptions`) in Expo Go.
> * If errors appear for other Node.js modules, you may need to add additional shims.
> * Check the codebase for examples of shims and Metro config setup.

---

## 📂 Project Structure

```
app/
├── (app)/             # Protected routes (require authentication)
│   └── home.tsx       # Home screen
├── context/           # React Context providers
│   └── AuthContext.tsx
├── types/             # TypeScript type definitions
├── _layout.tsx        # Root layout component
├── index.tsx          # Login screen
└── signup.tsx         # Signup screen
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch

   ```sh
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes

   ```sh
   git commit -m "Add some amazing feature"
   ```
4. Push to the branch

   ```sh
   git push origin feature/amazing-feature
   ```
5. Open a **Pull Request** 🎉

---

## 📜 License

This project is licensed under the **MIT License**.
See the [LICENSE](./LICENSE) file for details.

---

```

Thor ⚡, do you also want me to add **fancy shields.io badges** (like Expo, React Native, Supabase, TypeScript, MIT License) at the very top so your README looks even more **professional and eye-catching**?
```
