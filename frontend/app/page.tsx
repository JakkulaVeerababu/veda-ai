"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, ClipboardList, BookOpen, CheckCircle, FileText, Zap } from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalStudents: number;
  averageGrade: number;
  assignmentsPending: number;
  classesActive: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  time: string;
  icon: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivity: ActivityItem[];
  upcomingTasks: UpcomingTask[];
}

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function HomeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    import("@/lib/api").then(({ API_BASE_URL }) => {
      fetch(`${API_BASE_URL}/api/dashboard/`)
        .then((res) => res.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load dashboard data:", err);
          setLoading(false);
        });
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-screen bg-veda-gray-100 font-sans">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
            <div className="w-10 h-10 border-4 border-veda-orange border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-veda-gray-600 font-medium animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "check": return <CheckCircle className="text-green-500" size={20} />;
      case "file": return <FileText className="text-blue-500" size={20} />;
      case "zap": return <Zap className="text-veda-orange" size={20} />;
      default: return <FileText className="text-veda-gray-500" size={20} />;
    }
  };

  return (
    <div className="flex h-screen bg-veda-gray-100 font-sans">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto bg-white rounded-tl-2xl relative p-6">
          <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-veda-dark tracking-tight">Welcome back, Mr. Sharma</h1>
          <p className="text-veda-gray-600 mt-2">Here is what&apos;s happening in your classes today.</p>
        </div>
        <Link 
          href="/exams"
          className="px-5 py-2.5 bg-veda-dark text-white font-medium rounded-xl hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
        >
          <Zap size={18} className="text-veda-orange" />
          New Grade Assistant
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-veda-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-veda-gray-500 font-medium">Total Students</p>
            <p className="text-2xl font-bold text-veda-dark">{data.stats.totalStudents}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-veda-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-sm text-veda-gray-500 font-medium">Class Average</p>
            <p className="text-2xl font-bold text-veda-dark">{data.stats.averageGrade}%</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-veda-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm text-veda-gray-500 font-medium">Pending Graded</p>
            <p className="text-2xl font-bold text-veda-dark">{data.stats.assignmentsPending}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-veda-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-veda-gray-500 font-medium">Active Classes</p>
            <p className="text-2xl font-bold text-veda-dark">{data.stats.classesActive}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-veda-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-veda-dark mb-6">Recent Activity</h2>
          <div className="space-y-6">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="mt-1 w-10 h-10 bg-veda-gray-50 rounded-full flex items-center justify-center shrink-0 border border-veda-gray-100">
                  {getIcon(activity.icon)}
                </div>
                <div>
                  <p className="text-veda-dark font-medium">{activity.title}</p>
                  <p className="text-sm text-veda-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-2xl border border-veda-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-veda-dark mb-6">Upcoming Tasks</h2>
          <div className="space-y-4">
            {data.upcomingTasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl border border-veda-gray-100 bg-veda-gray-50 hover:bg-veda-gray-100 transition-colors cursor-pointer">
                <p className="font-medium text-veda-dark text-sm">{task.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-veda-orange"></span>
                  <span className="text-xs text-veda-gray-500 font-medium">{task.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2.5 rounded-xl border-2 border-veda-gray-200 text-veda-dark font-semibold text-sm hover:bg-veda-gray-50 transition-colors">
            View All Tasks
          </button>
        </div>
      </div>
          </div>
        </main>
      </div>
    </div>
  );
}
