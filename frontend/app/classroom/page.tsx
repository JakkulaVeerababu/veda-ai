"use client";

import { useEffect, useState } from "react";
import { Search, Filter, MoreHorizontal, Mail, Award, TrendingUp } from "lucide-react";

interface Student {
  id: string;
  name: string;
  grade: string;
  averageScore: number;
  attendance: string;
  avatar: string;
}

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function ClassroomPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    import("@/lib/api").then(({ API_BASE_URL }) => {
      fetch(`${API_BASE_URL}/api/classroom/students`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed");
          return res.json();
        })
        .then(data => {
          setStudents(data.students || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setStudents([]);
          setLoading(false);
        });
    });
  }, []);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-veda-gray-100 font-sans">
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
            <div className="w-10 h-10 border-4 border-veda-orange border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-veda-gray-600 font-medium animate-pulse">Loading roster...</p>
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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-veda-dark tracking-tight">My Classroom</h1>
          <p className="text-veda-gray-600 mt-2">Manage your 10th Grade Math students.</p>
        </div>
        <button className="px-5 py-2.5 bg-white text-veda-dark border-2 border-veda-gray-200 font-medium rounded-xl hover:bg-veda-gray-50 transition-colors">
          Add Student
        </button>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-veda-gray-400" size={20} />
          <input 
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-veda-gray-200 focus:outline-none focus:ring-2 focus:ring-veda-orange focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2.5 flex items-center gap-2 bg-white border border-veda-gray-200 rounded-xl text-veda-dark font-medium hover:bg-veda-gray-50 transition-colors shadow-sm">
          <Filter size={18} />
          Filter
        </button>
      </div>

      {/* Students Grid */}
      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-veda-gray-200 rounded-2xl bg-veda-gray-50/50">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <Search className="text-veda-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-veda-dark mb-2">No students yet</h3>
          <p className="text-veda-gray-500 max-w-md mx-auto mb-6">
            Your classroom roster is completely clean. Click "Add Student" in the top right to start building your class.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white rounded-2xl border border-veda-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 rounded-full bg-veda-dark text-white flex items-center justify-center text-2xl font-bold shadow-sm">
                  {student.name.charAt(0)}
                </div>
                <button className="text-veda-gray-400 hover:text-veda-dark transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-veda-dark">{student.name}</h3>
              <p className="text-sm text-veda-gray-500 mb-6">{student.grade} Grade</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-veda-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-veda-gray-500 mb-1">
                    <Award size={14} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Average</span>
                  </div>
                  <p className={`text-xl font-bold ${student.averageScore >= 90 ? 'text-green-600' : student.averageScore >= 75 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {student.averageScore}%
                  </p>
                </div>
                <div className="bg-veda-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-veda-gray-500 mb-1">
                    <TrendingUp size={14} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Attendance</span>
                  </div>
                  <p className="text-xl font-bold text-veda-dark">
                    {student.attendance}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-veda-gray-100 bg-gray-50/50 flex justify-end">
              <button className="flex items-center gap-2 text-sm font-semibold text-veda-gray-600 hover:text-veda-dark transition-colors">
                <Mail size={16} />
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}
