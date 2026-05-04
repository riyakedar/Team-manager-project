import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { UserPlus, Mail, Lock, User as UserIcon, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user);
        navigate("/");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex justify-center mb-6">
             <div className="bg-blue-600 p-3 rounded-2xl">
               <UserPlus className="text-white w-6 h-6" />
             </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 tracking-tight mb-1">Create Account</h2>
          <p className="text-center text-gray-500 mb-8">Join the collaboration platform</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">Select Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("ADMIN")}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${role === 'ADMIN' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}
                >
                  Administrator
                </button>
                <button
                  type="button"
                  onClick={() => setRole("MEMBER")}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${role === 'MEMBER' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}
                >
                  Member
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all mt-4"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
