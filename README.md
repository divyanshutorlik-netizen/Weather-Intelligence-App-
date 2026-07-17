# Weather Intelligence

A highly polished, professional weather intelligence application integrating Open-Meteo geocoding & forecast telemetry, interactive microclimate charts, and robust offline weather planning logic.

## 🌟 Key Features

*   **Real-time & Forecast Telemetry:** Direct integration with the Open-Meteo API for real-time and 7-day forecast data.
*   **Aesthetic Microclimate Charts:** Beautiful, responsive visual representations of temperature trends, precipitation probabilities, and atmospheric conditions.
*   **Offline Weather Planning Engine:** On-device compute engine providing high-precision recommendations for clothing, health, and activities based on direct weather variables.
*   **Fast & Lightweight:** Built using React, Vite, Tailwind CSS, and Recharts with complete client-side execution—no backend server required.

---

## 🚀 Deployment Instructions

To deploy your Weather Intelligence App, follow these step-by-step instructions:

1.  **Link to GitHub:** 
    First, link Google AI Studio to GitHub by clicking the GitHub integration icon in the App Build header, authenticating your account, creating a new repository, and executing a direct commit push to transfer your project files.
2.  **Connect to Cloudflare:** 
    Next, log into your Cloudflare Dashboard, navigate to **Workers & Pages**, select **Connect to Git** under the Pages tab, and select your newly created GitHub repository.
3.  **Configure & Build:** 
    Finally, configure the deployment pipeline by confirming the build command is set to `npm run build`, the deployment command is `npx wrangler deploy`, and the build output directory is set to `dist` before clicking **Save and Deploy** to compile your code and launch your live, browser-accessible pages.dev weather application.

---

## 🛠️ Tech Stack & Development

*   **Framework:** React 18+ with Vite
*   **Styling:** Tailwind CSS
*   **Charts:** Recharts
*   **Icons:** Lucide React
*   **Type Safety:** TypeScript

### Local Setup

To run the application locally:

```bash
# Install dependencies
npm install

# Start the dev server on port 3000
npm run dev
```
