import React, { useState, useEffect, useMemo, useCallback } from "react";
import { questionPaperApi, examApi } from "../api/services";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import {
  FileText,
  Upload,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  FileCheck,
  Clock,
  Award,
  AlertCircle,
  FileUp,
  X,
  Sparkles,
  Download,
} from "lucide-react";

export const QuestionPapers = () => {
  const { role } = useAuth();
  const toast = useToast();
  const canManage = role === "teacher" || role === "admin" || role === "user";

  const [papers, setPapers] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExamFilter, setSelectedExamFilter] = useState("all");

  // Upload / Edit Modal
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);
  const [paperFormData, setPaperFormData] = useState({
    exam_id: "",
    subject_name: "",
    total_marks: 100,
    duration_minutes: 180,
    instructions: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [paperFormSubmitting, setPaperFormSubmitting] = useState(false);
  const [paperFormError, setPaperFormError] = useState("");

  // In-App PDF Viewer Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewSubject, setPreviewSubject] = useState("");
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);

  // Delete Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Direct Document Downloader ensuring proper file extension (.pdf / .docx)
  const handleDownloadPaper = async (url, subject) => {
    try {
      toast.info("Preparing document download...");
      const isWord =
        url.toLowerCase().includes(".doc") || url.toLowerCase().includes(".docx");
      const ext = isWord ? ".docx" : ".pdf";
      const filename = `${(subject || "Question_Paper").replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Download request failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      console.warn("Direct blob download failed, falling back to direct open:", err);
      window.open(url, "_blank");
    }
  };

  const fetchPapersAndExams = useCallback(async () => {
    setLoading(true);
    try {
      const [papersRes, examsRes] = await Promise.all([
        questionPaperApi.getAllQuestionPapers(),
        examApi.getAllExams(),
      ]);

      if (papersRes.success) setPapers(papersRes.data || []);
      if (examsRes.success) setExams(examsRes.data || []);
    } catch (error) {
      console.error("Fetch Question Papers Error:", error);
      toast.error("Failed to load question papers.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPapersAndExams();
  }, [fetchPapersAndExams]);

  // Handlers
  const handleOpenCreatePaper = () => {
    setEditingPaper(null);
    setPaperFormData({
      exam_id: exams.length > 0 ? String(exams[0].id) : "",
      subject_name: "",
      total_marks: 100,
      duration_minutes: 180,
      instructions: "Answer all questions. Show your working where appropriate.",
    });
    setSelectedFile(null);
    setPaperFormError("");
    setPaperModalOpen(true);
  };

  const handleOpenEditPaper = (paper) => {
    setEditingPaper(paper);
    setPaperFormData({
      exam_id: String(paper.exam_id || ""),
      subject_name: paper.subject_name,
      total_marks: paper.total_marks || 100,
      duration_minutes: paper.duration_minutes || 180,
      instructions: paper.instructions || "",
    });
    setSelectedFile(null);
    setPaperFormError("");
    setPaperModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setPaperFormError("Only PDF files are allowed.");
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setPaperFormError("File size cannot exceed 10MB.");
        setSelectedFile(null);
        return;
      }
      setPaperFormError("");
      setSelectedFile(file);
    }
  };

  const handleSubmitPaper = async (e) => {
    e.preventDefault();
    const trimmedSubject = paperFormData.subject_name.trim();

    if (!paperFormData.exam_id) {
      setPaperFormError("Please select an exam.");
      return;
    }
    if (!trimmedSubject) {
      setPaperFormError("Subject name is required.");
      return;
    }

    setPaperFormSubmitting(true);
    setPaperFormError("");

    try {
      const formData = new FormData();
      formData.append("exam_id", paperFormData.exam_id);
      formData.append("subject_name", trimmedSubject);
      formData.append("total_marks", paperFormData.total_marks);
      formData.append("duration_minutes", paperFormData.duration_minutes);
      formData.append("instructions", paperFormData.instructions.trim());

      if (selectedFile) {
        formData.append("question_paper", selectedFile);
      }

      if (editingPaper) {
        const res = await questionPaperApi.updateQuestionPaper(editingPaper.id, formData);
        if (res.success) {
          toast.success(`Question paper for "${trimmedSubject}" updated successfully.`);
          setPaperModalOpen(false);
          fetchPapersAndExams();
        }
      } else {
        const res = await questionPaperApi.createQuestionPaper(formData);
        if (res.success) {
          toast.success(`Question paper for "${trimmedSubject}" uploaded successfully.`);
          setPaperModalOpen(false);
          fetchPapersAndExams();
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to save question paper.";
      setPaperFormError(msg);
      toast.error(msg);
    } finally {
      setPaperFormSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!paperToDelete) return;
    setDeleting(true);
    try {
      const res = await questionPaperApi.deleteQuestionPaper(paperToDelete.id);
      if (res.success) {
        toast.success(`Question paper for "${paperToDelete.subject_name}" deleted.`);
        setDeleteConfirmOpen(false);
        fetchPapersAndExams();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete question paper.");
    } finally {
      setDeleting(false);
    }
  };

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSubject = p.subject_name?.toLowerCase().includes(q);
      const matchExam = p.exam_name?.toLowerCase().includes(q);
      const matchesSearch = matchSubject || matchExam;

      const matchesExam =
        selectedExamFilter === "all" || String(p.exam_id) === String(selectedExamFilter);

      return matchesSearch && matchesExam;
    });
  }, [papers, searchQuery, selectedExamFilter]);

  const pdfCount = papers.filter((p) => Boolean(p.file_url)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight">
              Question Papers
            </h1>
            <Badge variant="primary" size="lg">
              <FileUp className="w-4 h-4" />
              Cloudinary Storage
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-slate-300 mt-2 font-medium">
            Upload, inspect, and manage high-fidelity PDF and Word question papers linked to scheduled exams.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreatePaper}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 shrink-0"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Question Paper</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Total Papers"
          value={papers.length}
          subtitle="Registered subjects"
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="PDF Attachments"
          value={pdfCount}
          subtitle="Hosted on Cloudinary"
          icon={FileCheck}
          color="emerald"
        />
        <StatCard
          title="Exam Coverage"
          value={`${exams.length} Exams`}
          subtitle="Mapped schedules"
          icon={Award}
          color="purple"
        />
        <StatCard
          title="Avg Marks / Paper"
          value={papers.length > 0 ? `${Math.round(papers.reduce((s, p) => s + (p.total_marks || 0), 0) / papers.length)} pts` : "100 pts"}
          subtitle="Assessment standard"
          icon={Clock}
          color="cyan"
        />
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-slate-800/80 shadow-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject name, exam..."
            className="w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Exam Filter */}
          <select
            value={selectedExamFilter}
            onChange={(e) => setSelectedExamFilter(e.target.value)}
            className="px-4 py-3 text-sm sm:text-base rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
          >
            <option value="all">All Exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.exam_name} ({exam.class_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question Papers Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Fetching question papers..." />
      ) : filteredPapers.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No question papers found"
          description={
            searchQuery || selectedExamFilter !== "all"
              ? "No question papers matched your query."
              : "No question papers uploaded yet. Upload your first PDF question paper."
          }
          actionLabel={canManage ? "Upload Question Paper" : null}
          onAction={canManage ? handleOpenCreatePaper : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredPapers.map((paper) => (
            <div
              key={paper.id}
              className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800/80 min-h-[390px] flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/15 hover:border-indigo-500/50 group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-100 group-hover:text-indigo-300 transition-colors capitalize tracking-tight">
                      {paper.subject_name}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-400 font-semibold mt-1">
                      {paper.exam_name}
                    </p>
                  </div>

                  <Badge variant="purple" size="lg">
                    <Award className="w-4 h-4" />
                    <span>{paper.total_marks} Marks</span>
                  </Badge>
                </div>

                {/* Duration & Details */}
                <div className="flex items-center gap-3.5 py-3 px-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-5 text-sm text-slate-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{paper.duration_minutes} Mins</span>
                  </div>
                  <span className="text-slate-600">•</span>
                  <span>{Math.floor(paper.duration_minutes / 60)}h {paper.duration_minutes % 60}m</span>
                </div>

                {/* Instructions Snippet */}
                {paper.instructions && (
                  <p className="text-sm text-slate-300 mb-6 line-clamp-3 italic bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 leading-relaxed font-normal">
                    "{paper.instructions}"
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-5 border-t border-slate-800/80 flex items-center justify-between gap-3">
                {paper.file_url ? (
                  <div className="flex-1 flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        setPreviewPdfUrl(`http://localhost:5000/api/question-papers/${paper.id}/view`);
                        setPreviewSubject(paper.subject_name);
                        setUseGoogleViewer(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-sm sm:text-base font-bold transition-all shadow-md"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>View PDF</span>
                    </button>
                    <a
                      href={`http://localhost:5000/api/question-papers/${paper.id}/download`}
                      download={`${paper.subject_name}_Question_Paper.pdf`}
                      className="p-3.5 rounded-2xl text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/20 transition-all shadow-sm"
                      title="Download PDF Document"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 italic py-2">No File Attached</span>
                )}

                {canManage && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditPaper(paper)}
                      className="p-3.5 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800 transition-all"
                      title="Edit Paper"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setPaperToDelete(paper);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-3.5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-all"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD / EDIT QUESTION PAPER MODAL */}
      <Modal
        isOpen={paperModalOpen}
        onClose={() => setPaperModalOpen(false)}
        title={editingPaper ? "Edit Question Paper" : "Upload Question Paper"}
        subtitle="Upload a PDF or Word file and set exam parameters."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitPaper} className="space-y-4">
          {paperFormError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{paperFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Associated Exam <span className="text-rose-400">*</span>
            </label>
            <select
              value={paperFormData.exam_id}
              onChange={(e) => setPaperFormData({ ...paperFormData, exam_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Select an Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.exam_name} ({exam.class_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Subject Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={paperFormData.subject_name}
              onChange={(e) => setPaperFormData({ ...paperFormData, subject_name: e.target.value })}
              placeholder="e.g. Mathematics, Science, English"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Total Marks <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="10"
                max="200"
                value={paperFormData.total_marks}
                onChange={(e) => setPaperFormData({ ...paperFormData, total_marks: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Duration (Mins) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="15"
                max="360"
                value={paperFormData.duration_minutes}
                onChange={(e) => setPaperFormData({ ...paperFormData, duration_minutes: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Instructions
            </label>
            <textarea
              rows={2}
              value={paperFormData.instructions}
              onChange={(e) => setPaperFormData({ ...paperFormData, instructions: e.target.value })}
              placeholder="e.g. All questions are compulsory. Use of calculator is permitted."
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Attach Document (.pdf, .docx, .doc)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-4 text-center transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer block">
                <FileUp className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                {selectedFile ? (
                  <p className="text-sm font-bold text-emerald-400 truncate">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      Click to choose or drag & drop PDF / Word file
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Cloudinary secure document hosting
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setPaperModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={paperFormSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {paperFormSubmitting ? "Uploading to Cloudinary..." : editingPaper ? "Save Changes" : "Upload Paper"}
            </button>
          </div>
        </form>
      </Modal>

      {/* IN-APP DOCUMENT VIEWER MODAL */}
      <Modal
        isOpen={Boolean(previewPdfUrl)}
        onClose={() => setPreviewPdfUrl(null)}
        title={`PDF Document Viewer: ${previewSubject}`}
        subtitle="Live document viewer rendered directly with high-fidelity formatting."
        maxWidth="max-w-4xl"
      >
        {previewPdfUrl && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="md">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Interactive PDF Reader</span>
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewPdfUrl.replace("/view", "/download")}
                  download={`${previewSubject}_Question_Paper.pdf`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF (.pdf)</span>
                </a>
                <a
                  href={previewPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Screen</span>
                </a>
              </div>
            </div>

            <div className="w-full h-[68vh] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              <iframe
                src={previewPdfUrl}
                title="Question Paper Document"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleExecuteDelete}
        loading={deleting}
        title="Delete Question Paper"
        message={`Are you sure you want to delete the question paper for "${paperToDelete?.subject_name}"? This will also remove the attached PDF.`}
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default QuestionPapers;
