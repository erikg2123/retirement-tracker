# Retirement Tracker

## Overview
The Retirement Tracker is a web application designed to help users visualize and manage their retirement savings. It allows users to track their contributions, view projections of their retirement savings, and adjust settings related to their retirement plans.

## Features
- **Dashboard**: Provides an overview of the user's retirement status, including current savings, contributions, and projections.
- **Projection Chart**: Visualizes the projected growth of retirement savings over time based on user inputs.
- **Contribution Tracker**: Allows users to input and track their annual contributions to retirement accounts.
- **Milestone Timeline**: Displays key milestones in the user's retirement journey, such as target retirement age and expected savings goals.
- **Settings Panel**: Enables users to adjust settings related to their retirement plan, such as expected rate of return and inflation rate.

## Project Structure
```
retirement-tracker
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── utils
│   │   ├── types
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend
│   ├── src
│   │   ├── routes
│   │   ├── controllers
│   │   ├── models
│   │   ├── utils
│   │   └── app.ts
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the frontend directory and install dependencies:
   ```
   cd retirement-tracker/frontend
   npm install
   ```
3. Navigate to the backend directory and install dependencies:
   ```
   cd ../backend
   npm install
   ```

## Usage
1. Start the backend server:
   ```
   cd backend
   npm start
   ```
2. Start the frontend development server:
   ```
   cd ../frontend
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:3000` to access the application.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.