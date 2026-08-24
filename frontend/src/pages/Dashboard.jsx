import React, { useState, useEffect } from "react";
import { classApi, examApi, questionPaperApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import {
  School,
  Layers,
  CalendarDays,
  FileText,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  TrendingUp,
  Plus,
  ExternalLink,
} from "lucide-react";

export const Dashboard = ({ onNavigate }) => {
  const { user, role, isAuthenticated } = useAuth();

  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [classesRes, examsRes, papersRes] = await Promise.allSettled([
          classApi.getAllClasses(),
          examApi.getAllExams(),
          questionPaperApi.getAllQuestionPapers(),
        ]);

        if (classesRes.status === "fulfilled" && classesRes.value?.success) {
          setClasses(classesRes.value.data || []);
        }
        if (examsRes.status === "fulfilled" && examsRes.value?.success) {
          setExams(examsRes.value.data || []);
        }
        if (papersRes.status === "fulfilled" && papersRes.value?.success) {
          setQuestionPapers(papersRes.value.data || []);
        }
      } catch (error) {
        console.error("Dashboard Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalSections = classes.reduce((sum, c) => sum + (c.section_count || 0), 0);
  const totalCapacity = classes.reduce((sum, c) => sum + (c.total_capacity || 0), 0);
  const upcomingExams = exams.filter((e) => e.status === "Upcoming" || !e.status);

  if (loading) {
    return <LoadingSpinner text="Compiling dashboard analytics..." />;
  }

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-7 sm:p-10 border border-slate-800/80 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="primary" size="lg">
                <Sparkles className="w-4 h-4" />
                <span>EduVerse System Active</span>
              </Badge>
              {isAuthenticated && (
                <span className="text-xs sm:text-sm text-slate-400 font-semibold capitalize">
                  Logged in as {role}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight">
              {isAuthenticated && user
                ? `Hello, ${user.username}!`
                : "Welcome to EduVerse EMS"}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed font-medium">
              Complete Educational & Exam Management platform with live <strong>Class Section Count aggregation</strong>, exam conflict validation, and Cloudinary question paper repository.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate("classes")}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
            >
              <Layers className="w-5 h-5" />
              <span>Classes & Sections</span>
            </button>
            <button
              onClick={() => onNavigate("exams")}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm sm:text-base font-bold transition-all hover:border-slate-600 shadow-md"
            >
              <CalendarDays className="w-5 h-5 text-indigo-400" />
              <span>Exams</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Stat Widgets */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Registered Classes"
          value={classes.length}
          subtitle={`${totalSections} total sections`}
          icon={School}
          color="indigo"
        />
        <StatCard
          title="Active Sections"
          value={totalSections}
          subtitle={`${totalCapacity} student seats`}
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="Total Exams"
          value={exams.length}
          subtitle={`${upcomingExams.length} upcoming tests`}
          icon={CalendarDays}
          color="cyan"
        />
        <StatCard
          title="Question Papers"
          value={questionPapers.length}
          subtitle="Cloudinary uploaded"
          icon={FileText}
          color="purple"
        />
      </div>

      {/* Main Grid: Class-to-Section Distribution & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column (7 cols): Class-Section Live Distribution */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
                  <Layers className="w-6 h-6 text-indigo-400" />
                  <span>Class Section Breakdown</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Real-time section counts and student capacity per class
                </p>
              </div>
              <button
                onClick={() => onNavigate("classes")}
                className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
              >
                <span>Manage All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {classes.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-8 text-center">
                No classes registered yet.
              </p>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => {
                  const sectionPercentage =
                    totalSections > 0
                      ? Math.round(((cls.section_count || 0) / totalSections) * 100)
                      : 0;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => onNavigate("classes")}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90 transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-sm">
                            #{cls.id}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                              {cls.class_name}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-400">
                              {cls.description || "Active Academic Batch"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge
                            variant={cls.section_count > 0 ? "primary" : "warning"}
                            size="sm"
                          >
                            {cls.section_count} {cls.section_count === 1 ? "Section" : "Sections"}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1 font-medium">
                            {cls.total_capacity || 0} seats ({sectionPercentage}% of total)
                          </p>
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3.5">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(sectionPercentage, cls.section_count > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Upcoming Exams & Question Papers Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Exams Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span>Upcoming Exams</span>
              </h3>
              <button
                onClick={() => onNavigate("exams")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {exams.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No exams scheduled yet.
              </p>
            ) : (
              <div className="space-y-3">
                {exams.slice(0, 3).map((exam) => (
                  <div
                    key={exam.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                        {exam.exam_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {exam.class_name} • {exam.exam_type}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>
                          {exam.start_date?.split("T")[0]} to {exam.end_date?.split("T")[0]}
                        </span>
                      </p>
                    </div>

                    <Badge
                      variant={
                        exam.status === "Completed"
                          ? "success"
                          : exam.status === "Ongoing"
                          ? "warning"
                          : "primary"
                      }
                      size="sm"
                    >
                      {exam.status || "Upcoming"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Question Papers Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Question Papers</span>
              </h3>
              <button
                onClick={() => onNavigate("question-papers")}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {questionPapers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No question papers uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {questionPapers.slice(0, 3).map((paper) => (
                  <div
                    key={paper.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-200 capitalize">
                        {paper.subject_name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {paper.exam_name} • {paper.total_marks} Marks
                      </p>
                    </div>

                    {paper.file_url ? (
                      <a
                        href={paper.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>PDF</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500">No PDF</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
