import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { Plus, Folder, Users, ChevronRight } from "lucide-react";
import Sidebar from "../components/Sidebar.tsx";
import { motion } from "motion/react";

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  const fetchProjects = () => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setNewProject({ name: "", description: "" });
      fetchProjects();
    }
  };

  return (
    <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Project Directory</h2>
            <p className="text-gray-500 text-sm">Overview of all active team collaborations.</p>
          </div>
          {user?.role === "ADMIN" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </button>
          )}
        </header>

        {loading ? (
          <div className="text-gray-400 italic">Exploring data...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projects.map((project: any, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                key={project._id}
              >
                <Link
                  to={`/projects/${project._id}`}
                  className="group flex items-center p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="bg-gray-50 p-4 rounded-2xl group-hover:bg-blue-50 transition-colors mr-6">
                    <Folder className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{project.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-1">{project.description || "No description provided."}</p>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 space-x-6 mr-8">
                     <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{project.members.length + 1} members</span>
                     </div>
                     <div className="hidden sm:block">
                        <span className="text-xs uppercase font-bold tracking-wider text-gray-300">Admin:</span>
                        <span className="ml-2 text-gray-600 italic">{(project.admin as any).name}</span>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transform transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            ))}
            {projects.length === 0 && (
              <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-200 text-center">
                 <p className="text-gray-400 italic">No projects found. Create one to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Start New Project</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                    placeholder="E.g. Website Redesign"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none h-32"
                    placeholder="What is this project about?"
                  />
                </div>
                <div className="flex space-x-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
