# Tionge's Planner

**A mobile planning and reminder application built with React Native, Expo, and TypeScript.**

## Overview

Tionge's Planner is an iOS application designed to help users organize appointments, manage reminders, and keep track of important events.

Originally developed under the name *OnTrack*, the project evolved into a standalone iPhone application with persistent data storage, scheduled local notifications, and a customized user interface.

This project provided practical experience in mobile application development, from initial implementation and testing to native iOS configuration and deployment on a physical device.

## Key Features

- **Reminder Management:** Create and save reminders for appointments, tasks, and important events.
- **Scheduled Notifications:** Receive local notifications 60, 30, and 5 minutes before scheduled events.
- **Persistent Data Storage:** Store reminders locally using AsyncStorage, allowing data to persist between application sessions.
- **Custom User Interface:** A personalized planner interface with a custom application icon.
- **Standalone iOS Application:** Runs directly on an iPhone without requiring Expo Go or an active development server.

## Technology Stack

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile application development |
| Expo | Application development and native integration |
| TypeScript | Type-safe application development |
| Expo Router | Application routing |
| Expo Notifications | Scheduling local reminder notifications |
| AsyncStorage | Persistent local data storage |
| Xcode | Native iOS builds, signing, and device deployment |
| Git and GitHub | Version control and source code management |

## Installation and Setup

### Prerequisites

- Node.js and npm
- Git
- macOS and Xcode for native iOS development
- An iPhone or iOS simulator for testing

### 1. Clone the repository

```bash
git clone https://github.com/KettyKay/Tionges-Planner.git
cd Tionges-Planner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npx expo start
```

### 4. Run the iOS application

For a native iOS development build:

```bash
npx expo run:ios
```

Native iOS development requires Xcode and the appropriate device signing configuration.

## Project Development

The application was developed through several stages:

1. **Initial Development:** Created the application interface and implemented reminder management functionality.
2. **Data Persistence:** Integrated AsyncStorage to retain saved reminders between sessions.
3. **Notification Integration:** Implemented scheduled local notifications using Expo Notifications.
4. **iOS Configuration:** Configured the native iOS project, application identity, icon, and development signing.
5. **Device Deployment:** Built and installed the application on a physical iPhone using Xcode.
6. **Release Build:** Created and tested an iOS Release build that operates without an active Expo development server.

## Screenshots

Screenshots demonstrating the application's interface and reminder functionality will be added here.

## Future Enhancements

Potential improvements include:

- Recurring reminders and appointments
- Calendar-based event visualization
- Enhanced reminder categorization
- Additional interface customization
- Improved event management and organization

## Skills Demonstrated

This project demonstrates practical experience in:

- React Native and TypeScript development
- Mobile
