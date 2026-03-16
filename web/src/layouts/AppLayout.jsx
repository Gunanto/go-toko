import { useState } from "react";
import PropTypes from "prop-types";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-24 lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppLayout;
