import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { Plus, UserPlus, Info, Calendar, MoreVertical, Trash2 } from "lucide-react";
import Sidebar from "../components/Sidebar.tsx";
import { motion, AnimatePresence } from "motion/react";
import { io } from "socket.io-client";

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "MEDIUM", status: "TODO", dueDate: "" });
  
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Socket setup
    socketRef.current = io();
    socketRef.current.emit("join-project", id);
    
    socketRef.current.on("task-updated", (data: any) => {
        fetchTasks();
    });

    fetchProject();
    fetchTasks();

    return () => {
      socketRef.current.disconnect();
    };
  }, [id]);

  const fetchProject = () => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => setProject(data));
  };

  const fetchTasks = () => {
    fetch(`/api/tasks?projectId=${id}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTask, projectId: id })
    });
    if (res.ok) {
      setIsTaskModalOpen(false);
      setNewTask({ title: "", description: "", priority: "MEDIUM", status: "TODO", dueDate: "" });
      fetchTasks();
      socketRef.current.emit("task-update", { projectId: id });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: memberEmail })
    });
    if (res.ok) {
        setIsMemberModalOpen(false);
        setMemberEmail("");
        fetchProject();
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      fetchTasks();
      socketRef.current.emit("task-update", { projectId: id });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Delete this task?")) return;
    const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    if (res.ok) {
      fetchTasks();
      socketRef.current.emit("task-update", { projectId: id });
    }
  };

  const columns = [
    { title: "To Do", status: "TODO", color: "bg-gray-100", border: "border-gray-200" },
    { title: "In Progress", status: "IN_PROGRESS", color: "bg-blue-50", border: "border-blue-200" },
    { title: "Done", status: "DONE", color: "bg-green-50", border: "border-green-200" },
  ];

  if (loading || !project) return <div className="text-center p-20 italic text-gray-400">Synchronizing team workspace...</div>;

  return (
    <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 flex flex-col h-screen">
        <header className="mb-8 flex justify-between items-start">
          <div className="flex-1">
            <nav className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center">
              <span className="hover:text-blue-500 cursor-pointer" onClick={() => navigate("/projects")}>Projects</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{project.name}</span>
            </nav>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{project.name}</h2>
            <p className="text-gray-500 mt-1 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex space-x-3">
             <div className="flex -space-x-2 mr-4">
                {(project.members || []).slice(0, 3).map((m: any) => (
                   <div key={m._id} title={m.name} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {m.name.charAt(0)}
                   </div>
                ))}
                {project.members.length > 3 && (
                   <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                      +{project.members.length - 3}
                   </div>
                )}
             </div>
             {user?.role === "ADMIN" && (
                <>
                  <button
                    onClick={() => setIsMemberModalOpen(true)}
                    className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all flex items-center shadow-sm"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    <span className="text-sm font-bold">Invite</span>
                  </button>
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center shadow-lg shadow-blue-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </button>
                </>
             )}
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden pb-4">
          {columns.map((col) => (
            <div key={col.status} className="flex flex-col h-full bg-[#f1f3f5] rounded-3xl p-4 border border-transparent">
              <div className="flex items-center justify-between mb-4 px-2">
                 <h4 className="text-sm font-bold text-gray-900 tracking-tight flex items-center">
                    <span className="w-2 h-2 rounded-full mr-2 bg-gray-400"></span>
                    {col.title}
                 </h4>
                 <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === col.status).length}
                 </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                <AnimatePresence>
                {tasks.filter(t => t.status === col.status).map((task) => (
                  <motion.div
                    key={task._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                          task.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                       }`}>
                          {task.priority}
                       </span>
                       <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user?.role === "ADMIN" && (
                             <button onClick={() => deleteTask(task._id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600">
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          )}
                          <select 
                            value={task.status}
                            onChange={(e) => updateStatus(task._id, e.target.value)}
                            className="text-[10px] bg-gray-50 border-none rounded outline-none px-1"
                          >
                             <option value="TODO">→ To Do</option>
                             <option value="IN_PROGRESS">→ In Progress</option>
                             <option value="DONE">→ Done</option>
                          </select>
                       </div>
                    </div>
                    <h5 className="text-sm font-bold text-gray-900 leading-tight mb-1">{task.title}</h5>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{task.description}</p>
                    
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                       <div className="flex items-center text-[10px] text-gray-400 font-medium">
                          <Calendar className="w-3 h-3 mr-1" />
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                       </div>
                       <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500" title={task.assignee?.name || 'Unassigned'}>
                          {task.assignee?.name.charAt(0) || '?'}
                       </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
                {tasks.filter(t => t.status === col.status).length === 0 && (
                   <div className="h-24 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Empty</p>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modals */}
        {isTaskModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-6">Create New Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Title</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                    placeholder="Task summary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none h-24"
                    placeholder="Provide details..."
                  />
                </div>
                <div className="flex space-x-3 mt-6">
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100">Create Task</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isMemberModalOpen && (
           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
           <div className="bg-white max-w-sm w-full rounded-3xl p-8 shadow-2xl text-center">
             <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
             </div>
             <h3 className="text-xl font-bold mb-2">Invite Team Member</h3>
             <p className="text-gray-500 text-sm mb-6">Add someone by their professional email.</p>
             <form onSubmit={handleAddMember} className="space-y-4">
               <input
                 type="email"
                 required
                 value={memberEmail}
                 onChange={(e) => setMemberEmail(e.target.value)}
                 className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none"
                 placeholder="colleague@company.com"
               />
               <div className="flex space-x-3 pt-2">
                 <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black shadow-lg shadow-gray-200">Invite</button>
               </div>
             </form>
           </div>
         </div>
        )}
      </main>
    </div>
  );
};

export default ProjectDetail;
