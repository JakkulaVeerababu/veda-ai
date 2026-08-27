"use client";

import { useEffect, useState } from "react";
import { FileText, Users, Calendar, CheckCircle, Clock } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  class: string;
  dueDate?: string;
  submittedCount?: number;
  gradedCount?: number;
  totalCount: number;
  averageScore?: string;
  status: "collecting" | "completed";
}

interface AssignmentsData {
  active: Assignment[];
  graded: Assignment[];
}

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function AssignmentsPage() {
  const [data, setData] = useState<AssignmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    import("@/lib/api").then(({ API_BASE_URL }) => {
      fetch(`${API_BASE_URL}/api/assignments/`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
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
            <p className="mt-4 text-veda-gray-600 font-medium animate-pulse">Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-veda-gray-100 font-sans">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-white rounded-tl-2xl relative p-6">
          <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-veda-dark tracking-tight">Assignments</h1>
          <p className="text-veda-gray-600 mt-2">Manage ongoing and completed assignments.</p>
        </div>
        <button className="px-5 py-2.5 bg-veda-dark text-white font-medium rounded-xl hover:bg-black transition-colors shadow-sm">
          Create Assignment
        </button>
      </div>

      {/* Active Assignments */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-veda-dark mb-6 flex items-center gap-2">
          <Clock className="text-veda-orange" size={24} />
          Active Assignments
        </h2>
        {data.active.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-veda-gray-200 rounded-2xl bg-veda-gray-50/50">
            <Clock className="text-veda-gray-300 mb-4" size={32} />
            <p className="text-lg font-bold text-veda-dark mb-1">No active assignments</p>
            <p className="text-veda-gray-500 max-w-sm">You don't have any assignments currently collecting submissions.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.active.map(assignment => (
              <div key={assignment.id} className="bg-white rounded-2xl border border-veda-gray-200 shadow-sm p-6 hover:border-veda-gray-300 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                    <FileText size={24} />
                  </div>
                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Collecting
                  </span>
                </div>
                <h3 className="text-lg font-bold text-veda-dark mb-1">{assignment.title}</h3>
                <p className="text-sm text-veda-gray-500 mb-6">{assignment.class}</p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-veda-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      Due: {assignment.dueDate}
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Users size={16} />
                      {assignment.submittedCount} / {assignment.totalCount} Submitted
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-veda-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${((assignment.submittedCount || 0) / assignment.totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Graded Assignments */}
      <div>
        <h2 className="text-xl font-bold text-veda-dark mb-6 flex items-center gap-2">
          <CheckCircle className="text-green-500" size={24} />
          Graded Assignments
        </h2>
        {data.graded.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-veda-gray-200 rounded-2xl bg-veda-gray-50/50">
            <CheckCircle className="text-veda-gray-300 mb-4" size={32} />
            <p className="text-lg font-bold text-veda-dark mb-1">No graded assignments</p>
            <p className="text-veda-gray-500 max-w-sm">Completed and graded assignments will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-veda-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-veda-gray-50 border-b border-veda-gray-200 text-xs uppercase tracking-wider text-veda-gray-500 font-semibold">
                  <th className="px-6 py-4">Assignment Name</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Avg Score</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-veda-gray-100">
                {data.graded.map(assignment => (
                  <tr key={assignment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-veda-dark">{assignment.title}</div>
                    </td>
                    <td className="px-6 py-4 text-veda-gray-600 text-sm">{assignment.class}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-veda-dark">{assignment.averageScore}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-sm font-semibold text-veda-orange hover:text-orange-700 transition-colors">
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
          </div>
        </main>
      </div>
    </div>
  );
}
