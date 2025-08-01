import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header is rendered globally by App.js, so it's removed from here */}
      <main className="flex-grow">
        <Outlet /> {/* This renders the nested route (e.g. Home, About, etc.) */}
      </main>
      <Footer /> {/* Footer is rendered here for routes using MainLayout */}
    </div>
  );
};

export default MainLayout;
