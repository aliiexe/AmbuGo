# AmbuGo Project

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   Yarn

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/wahibonae/ambu-go
    cd ambu-go
    ```

2.  **Install dependencies:**

    Open your terminal in the project root and run:

    ```bash
    yarn install
    ```

3.  **Set up environment variables:**

    ```env
    DATABASE_URL=your_database_url
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
    CLERK_SECRET_KEY=your_secret_key
    NEXT_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key
    ```

    For traffic data, you'll need to obtain a TomTom API key from [TomTom Developer Portal](https://developer.tomtom.com/).

### Running the Development Server

Once the dependencies are installed and environment variables are set up, you can start the development server:

```bash
yarn dev
```

This will start the server, typically on `http://localhost:3000`.
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Technologies

*   **Next.js:** React framework for production.
*   **Tailwind CSS:** Utility-first CSS framework.
*   **Clerk:** Authentication and user management.
*   **React Hot Toast:** Notifications.
*   **Neon:** PostgreSQL Database.
*   **TomTom API:** Real-time traffic data and routing.

## Authors

*   **wahib**
*   **ali**
*   **aboubakr**
*   **ahmed**
