import React, { useState, useEffect, useMemo } from "react";
import { classApi, sectionApi, examApi, questionPaperApi } from "../../api/services";
import { Badge } from "./Badge";
import {
  Search,
  School,
  Layers,
  CalendarDays,
  FileText,
  ArrowRight,
  X,
  Sparkles,
  Command,
  CornerDownLeft,
} from "lucide-react";

export const GlobalSearchModal = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all resources when search modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [clsRes, secRes, exRes, qpRes] = await Promise.allSettled([
          classApi.getAllClasses(),
          sectionApi.getAllSections(),
          examApi.getAllExams(),
          questionPaperApi.getAllQuestionPapers(),
        ]);

        if (clsRes.status === "fulfilled" && clsRes.value?.success) {
          setClasses(clsRes.value.data || []);
        }
        if (secRes.status === "fulfilled" && secRes.value?.success) {
          setSections(secRes.value.data || []);
        }
        if (exRes.status === "fulfilled" && exRes.value?.success) {
          setExams(exRes.value.data || []);
        }
        if (qpRes.status === "fulfilled" && qpRes.value?.success) {
          setPapers(qpRes.value.data || []);
        }
      } catch (err) {
        console.error("Global search data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    setQuery("");
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Search Results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { classes: [], sections: [], exams: [], papers: [], total: 0 };

    const matchedClasses = classes.filter(
      (c) =>
        c.class_name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );

    const matchedSections = sections.filter(
      (s) =>
        s.section_name?.toLowerCase().includes(q) ||
        s.class_teacher?.toLowerCase().includes(q) ||
        s.class_name?.toLowerCase().includes(q)
    );

    const matchedExams = exams.filter(
      (e) =>
        e.exam_name?.toLowerCase().includes(q) ||
        e.class_name?.toLowerCase().includes(q) ||
        e.exam_type?.toLowerCase().includes(q)
    );

    const matchedPapers = papers.filter(
      (p) =>
        p.subject_name?.toLowerCase().includes(q) ||
        p.exam_name?.toLowerCase().includes(q) ||
        p.instructions?.toLowerCase().includes(q)
    );

    const total =
      matchedClasses.length +
      matchedSections.length +
      matchedExams.length +
      matchedPapers.length;

    return {
      classes: matchedClasses.slice(0, 4),
      sections: matchedSections.slice(0, 4),
      exams: matchedExams.slice(0, 4),
      papers: matchedPapers.slice(0, 4),
      total,
    };
  }, [query, classes, sections, exams, papers]);

  const handleSelect = (tab) => {
    onNavigate(tab);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Spotlight Command Box */}
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl shadow-2xl border border-slate-700/70 overflow-hidden z-10 animate-in zoom-in-95 fade-in duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search classes, sections, exams, teachers, question papers..."
            autoFocus
            className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 font-mono">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="py-8 text-center text-slate-500 text-xs sm:text-sm">
              <Sparkles className="w-8 h-8 text-indigo-400/60 mx-auto mb-2" />
              <p className="font-semibold text-slate-400">Quick Resource Navigator</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Type keywords like "Grade 10", "Section B", "Mathematics", or "Teacher" to search.
              </p>
            </div>
          ) : results.total === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
              <p className="font-bold text-slate-300">No resources found</p>
              <p className="text-xs text-slate-500 mt-1">
                No matching classes, sections, exams, or papers for "{query}".
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Classes Results */}
              {results.classes.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Classes ({results.classes.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {results.classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => handleSelect("classes")}
                        className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-indigo-600/20 border border-slate-800/80 hover:border-indigo-500/40 text-left flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                            #{cls.id}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                              {cls.class_name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {cls.description || "Academic Class"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="primary" size="sm">
                          {cls.section_count || 0} Sections
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections Results */}
              {results.sections.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sections ({results.sections.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {results.sections.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => handleSelect("classes")}
                        className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-emerald-600/20 border border-slate-800/80 hover:border-emerald-500/40 text-left flex items-center justify-between transition-all group"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                            Section {sec.section_name} ({sec.class_name})
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Teacher: {sec.class_teacher || "Unassigned"} • {sec.capacity} seats
                          </p>
                        </div>
                        <span className="text-xs text-emerald-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exams Results */}
              {results.exams.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Exams ({results.exams.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {results.exams.map((exam) => (
                      <button
                        key={exam.id}
                        onClick={() => handleSelect("exams")}
                        className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-cyan-600/20 border border-slate-800/80 hover:border-cyan-500/40 text-left flex items-center justify-between transition-all group"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {exam.exam_name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {exam.class_name} • {exam.exam_type}
                          </p>
                        </div>
                        <Badge variant="cyan" size="sm">
                          {exam.status || "Upcoming"}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Question Papers Results */}
              {results.papers.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>Question Papers ({results.papers.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {results.papers.map((paper) => (
                      <button
                        key={paper.id}
                        onClick={() => handleSelect("question-papers")}
                        className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-purple-600/20 border border-slate-800/80 hover:border-purple-500/40 text-left flex items-center justify-between transition-all group"
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors capitalize">
                            {paper.subject_name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {paper.exam_name} • {paper.total_marks} Marks
                          </p>
                        </div>
                        <span className="text-xs text-purple-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
          <span>Search across all school resources</span>
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
