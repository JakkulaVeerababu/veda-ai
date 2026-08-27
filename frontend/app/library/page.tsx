"use client";

import { useEffect, useState } from "react";
import { Folder, Search, File, FileText, Download, MoreVertical } from "lucide-react";

interface Document {
  id: string;
  title: string;
  type: string;
  size: string;
  date: string;
}

interface LibraryData {
  documents: Document[];
}

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function LibraryPage() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    import("@/lib/api").then(({ API_BASE_URL }) => {
      fetch(`${API_BASE_URL}/api/library/`)
        .then(res => res.json())
        .then(json => {
          setData(json);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setData({ documents: [] });
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
            <p className="mt-4 text-veda-gray-600 font-medium animate-pulse">Loading library...</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredDocs = data.documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const getDocIcon = (type: string) => {
    if (type.includes("Template") || type.includes("Notes")) return <File className="text-blue-500" size={24} />;
    if (type.includes("Rubric")) return <FileText className="text-green-500" size={24} />;
    return <FileText className="text-veda-orange" size={24} />;
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
          <h1 className="text-3xl font-bold text-veda-dark tracking-tight">My Library</h1>
          <p className="text-veda-gray-600 mt-2">Access your saved rubrics, templates, and past exams.</p>
        </div>
        <button className="px-5 py-2.5 bg-veda-dark text-white font-medium rounded-xl hover:bg-black transition-colors shadow-sm flex items-center gap-2">
          <Folder size={18} />
          Upload Document
        </button>
      </div>

      {/* Controls */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-veda-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Search documents by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-veda-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-veda-orange focus:border-transparent"
        />
      </div>

      {/* Document List */}
      {data.documents.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-veda-gray-200 rounded-2xl bg-veda-gray-50/50">
          <Folder className="text-veda-gray-300 mb-4" size={48} />
          <p className="text-xl font-bold text-veda-dark mb-2">Your library is empty</p>
          <p className="text-veda-gray-500 max-w-md">Upload your rubrics, templates, and past exams to access them easily during grading.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-veda-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-veda-gray-50 border-b border-veda-gray-200 text-xs uppercase tracking-wider text-veda-gray-500 font-semibold">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 hidden md:table-cell">Type</th>
                <th className="px-6 py-4 hidden sm:table-cell">Date Added</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-veda-gray-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                        {getDocIcon(doc.type)}
                      </div>
                      <span className="font-semibold text-veda-dark">{doc.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-veda-gray-500 text-sm hidden sm:table-cell">
                    {doc.date}
                  </td>
                  <td className="px-6 py-4 text-veda-gray-500 text-sm">
                    {doc.size}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-veda-gray-500 hover:text-veda-dark hover:bg-veda-gray-100 rounded-lg transition-colors">
                        <Download size={18} />
                      </button>
                      <button className="p-2 text-veda-gray-500 hover:text-veda-dark hover:bg-veda-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-veda-gray-500">
                    No documents found matching &quot;{search}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
          </div>
        </main>
      </div>
    </div>
  );
}
