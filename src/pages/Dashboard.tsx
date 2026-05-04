import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import Sidebar from "../components/Sidebar.tsx";
import { motion } from "motion/react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen font-sans text-gray-500">Loading Dashboard...</div>;

  const statCards = [
    { title: "Total Tasks", value: stats.total, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "In Progress", value: stats.inProgress, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
    { title: "Completed", value: stats.done, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { title: "Overdue", value: stats.overdue, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="flex bg-[#f8f9fa] min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.name}</h2>
          <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.title}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-gray-500 text-sm font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity or Task List could go here */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Breakdown</h3>
          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 mb-6 font-sans">
             <div className="bg-green-500 h-full" style={{ width: `${(stats.done/stats.total)*100 || 0}%` }}></div>
             <div className="bg-yellow-500 h-full" style={{ width: `${(stats.inProgress/stats.total)*100 || 0}%` }}></div>
             <div className="bg-blue-500 h-full" style={{ width: `${(stats.todo/stats.total)*100 || 0}%` }}></div>
          </div>
          <div className="flex gap-4 text-sm font-medium">
            <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Done</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span> In Progress</div>
            <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> To Do</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
