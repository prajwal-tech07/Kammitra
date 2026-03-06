import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Chatbot from "./Chatbot";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © 2026 KaamMitra. Built for India's everyday workforce.
      </footer>
      <Chatbot />
    </div>
  );
}

export default Layout;
