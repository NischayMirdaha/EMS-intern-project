import React, { useState, useEffect, useMemo, useCallback } from "react";
import { examApi, classApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Clock,
  School,
  Sparkles,
  AlertCircle,
  Calendar,
  CheckCircle2,
  LayoutGrid,
  List,
} from "lucide-react";

export const Exams = () => {
  const { role } = useAuth();
  const toast = useToast();
  const canManage = role === "teacher" || role === "admin" || role === "user";

  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'timeline'

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Create / Edit Modal
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examFormData, setExamFormData] = useState({
    class_id: "",
    exam_name: "",
    exam_type: "Terminal",
    start_date: "",
    end_date: "",
    status: "Upcoming",
  });
  const [examFormSubmitting, setExamFormSubmitting] = useState(false);
  const [examFormError, setExamFormError] = useState("");

  // Delete Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExamsAndClasses = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, classesRes] = await Promise.all([
        examApi.getAllExams(),
        classApi.getAllClasses(),
      ]);

      if (examsRes.success) setExams(examsRes.data || []);
      if (classesRes.success) setClasses(classesRes.data || []);
    } catch (error) {
      console.error("Fetch Exams Error:", error);
      toast.error("Failed to load exams list.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExamsAndClasses();
  }, [fetchExamsAndClasses]);

  // Handlers
  const handleOpenCreateExam = () => {
    setEditingExam(null);
    setExamFormData({
      class_id: classes.length > 0 ? String(classes[0].id) : "",
      exam_name: "",
      exam_type: "Terminal",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      status: "Upcoming",
    });
    setExamFormError("");
    setExamModalOpen(true);
  };

  const handleOpenEditExam = (exam) => {
    setEditingExam(exam);
    setExamFormData({
      class_id: String(exam.class_id || ""),
      exam_name: exam.exam_name,
      exam_type: exam.exam_type || "Terminal",
      start_date: exam.start_date ? exam.start_date.split("T")[0] : "",
      end_date: exam.end_date ? exam.end_date.split("T")[0] : "",
      status: exam.status || "Upcoming",
    });
    setExamFormError("");
    setExamModalOpen(true);
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    setExamFormSubmitting(true);
    setExamFormError("");

    if (new Date(examFormData.end_date) < new Date(examFormData.start_date)) {
      setExamFormError("End date cannot be earlier than start date.");
      setExamFormSubmitting(false);
      return;
    }

    try {
      const payload = {
        class_id: parseInt(examFormData.class_id, 10),
        exam_name: examFormData.exam_name.trim(),
        exam_type: examFormData.exam_type,
        start_date: examFormData.start_date,
        end_date: examFormData.end_date,
        status: examFormData.status,
      };

      if (editingExam) {
        const res = await examApi.updateExam(editingExam.id, payload);
        if (res.success) {
          toast.success(`Exam "${payload.exam_name}" updated successfully.`);
          setExamModalOpen(false);
          fetchExamsAndClasses();
        }
      } else {
        const res = await examApi.createExam(payload);
        if (res.success) {
          toast.success(`Exam "${payload.exam_name}" scheduled successfully.`);
          setExamModalOpen(false);
          fetchExamsAndClasses();
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to save exam schedule.";
      setExamFormError(msg);
      toast.error(msg);
    } finally {
      setExamFormSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!examToDelete) return;
    setDeleting(true);
    try {
      const res = await examApi.deleteExam(examToDelete.id);
      if (res.success) {
        toast.success(`Exam "${examToDelete.exam_name}" deleted.`);
        setDeleteConfirmOpen(false);
        fetchExamsAndClasses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete exam.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered list
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = searchQuery.toLowerCase();
      const matchName = exam.exam_name?.toLowerCase().includes(q);
      const matchClass = exam.class_name?.toLowerCase().includes(q);
      const matchType = exam.exam_type?.toLowerCase().includes(q);
      const matchesSearch = matchName || matchClass || matchType;

      const matchesClass =
        selectedClassFilter === "all" ||
        String(exam.class_id) === String(selectedClassFilter) ||
        exam.class_name === selectedClassFilter;

      const matchesStatus =
        selectedStatusFilter === "all" || exam.status === selectedStatusFilter;

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [exams, searchQuery, selectedClassFilter, selectedStatusFilter]);

  const upcomingCount = exams.filter((e) => e.status === "Upcoming").length;
  const ongoingCount = exams.filter((e) => e.status === "Ongoing").length;
  const completedCount = exams.filter((e) => e.status === "Completed").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight">
              Exams Schedule
            </h1>
            <Badge variant="primary" size="lg">
              <Calendar className="w-4 h-4" />
              Conflict Guard Active
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-slate-300 mt-2 font-medium">
            Schedule examinations, evaluate date overlap conflicts, and link with question papers.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreateExam}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Schedule Exam</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Total Exams"
          value={exams.length}
          subtitle="All academic terms"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Upcoming Tests"
          value={upcomingCount}
          subtitle="Awaiting start date"
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="Ongoing"
          value={ongoingCount}
          subtitle="In active testing"
          icon={Sparkles}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={completedCount}
          subtitle="Past examinations"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exam name, type..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "timeline"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Visual Timeline Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content (Table or Visual Timeline) */}
      {loading ? (
        <LoadingSpinner text="Fetching exam schedules..." />
      ) : filteredExams.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No exams found"
          description={
            searchQuery || selectedClassFilter !== "all" || selectedStatusFilter !== "all"
              ? "No exams match your filter query."
              : "No exams scheduled yet. Schedule your first exam."
          }
          actionLabel={canManage ? "Schedule Exam" : null}
          onAction={canManage ? handleOpenCreateExam : null}
        />
      ) : viewMode === "timeline" ? (
        /* Visual Timeline Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800/80 min-h-[380px] flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/15 hover:border-indigo-500/50 group"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-100 group-hover:text-indigo-300 transition-colors tracking-tight">
                      {exam.exam_name}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-400 font-semibold mt-1">
                      {exam.class_name}
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
                    size="lg"
                    className="font-bold shrink-0"
                  >
                    {exam.status || "Upcoming"}
                  </Badge>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 font-medium">Exam Type:</span>
                    <span className="font-bold text-slate-100">{exam.exam_type}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 font-medium">Start Date:</span>
                    <span className="font-mono font-bold text-indigo-300 text-sm sm:text-base">{exam.start_date?.split("T")[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 font-medium">End Date:</span>
                    <span className="font-mono font-bold text-indigo-300 text-sm sm:text-base">{exam.end_date?.split("T")[0]}</span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="pt-5 border-t border-slate-800/80 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleOpenEditExam(exam)}
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-bold border border-slate-700 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setExamToDelete(exam);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-3.5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-all shadow-sm"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Exam ID</th>
                  <th className="py-3.5 px-4">Exam Name</th>
                  <th className="py-3.5 px-4">Target Class</th>
                  <th className="py-3.5 px-4">Exam Type</th>
                  <th className="py-3.5 px-4">Schedule Period</th>
                  <th className="py-3.5 px-4">Status</th>
                  {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">#{exam.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{exam.exam_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {exam.class_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700">
                        {exam.exam_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                      {exam.start_date?.split("T")[0]} → {exam.end_date?.split("T")[0]}
                    </td>
                    <td className="py-3.5 px-4">
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
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditExam(exam)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Exam"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setExamToDelete(exam);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EXAM MODAL */}
      <Modal
        isOpen={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        title={editingExam ? "Edit Exam Schedule" : "Schedule New Exam"}
        subtitle="Configure exam details, target class, dates, and status."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitExam} className="space-y-4">
          {examFormError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{examFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Target Class <span className="text-rose-400">*</span>
            </label>
            <select
              value={examFormData.class_id}
              onChange={(e) => setExamFormData({ ...examFormData, class_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Select a Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.section_count || 0} sections)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Exam Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={examFormData.exam_name}
              onChange={(e) => setExamFormData({ ...examFormData, exam_name: e.target.value })}
              placeholder="e.g. First Terminal Examination"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Exam Type
              </label>
              <select
                value={examFormData.exam_type}
                onChange={(e) => setExamFormData({ ...examFormData, exam_type: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Terminal">Terminal</option>
                <option value="Unit Test">Unit Test</option>
                <option value="Mid-Term">Mid-Term</option>
                <option value="Final Examination">Final Examination</option>
                <option value="Mock Test">Mock Test</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Status
              </label>
              <select
                value={examFormData.status}
                onChange={(e) => setExamFormData({ ...examFormData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Start Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={examFormData.start_date}
                onChange={(e) => setExamFormData({ ...examFormData, start_date: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                End Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={examFormData.end_date}
                onChange={(e) => setExamFormData({ ...examFormData, end_date: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setExamModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={examFormSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {examFormSubmitting ? "Saving..." : editingExam ? "Save Changes" : "Schedule Exam"}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleExecuteDelete}
        loading={deleting}
        title="Delete Exam Schedule"
        message={`Are you sure you want to delete "${examToDelete?.exam_name}"? WARNING: This will also delete any question papers linked to this exam.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default Exams;
