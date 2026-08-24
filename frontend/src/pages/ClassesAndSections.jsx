import React, { useState, useEffect, useMemo, useCallback } from "react";
import { classApi, sectionApi } from "../api/services";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";
import { Modal } from "../components/common/Modal";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import {
  Layers,
  Users,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  ExternalLink,
  School,
  GraduationCap,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Filter,
  Check,
  AlertCircle,
  Hash,
  UserCheck,
  Download,
  Printer,
} from "lucide-react";

export const ClassesAndSections = () => {
  const toast = useToast();
  const { role } = useAuth();
  const canManage = role === "teacher" || role === "admin" || role === "user";

  // Data states
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View & Filter states
  const [activeTab, setActiveTab] = useState("classes"); // 'classes' or 'all-sections'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  // Modals state
  const [selectedClassForSections, setSelectedClassForSections] = useState(null);
  const [classSectionsList, setClassSectionsList] = useState([]);
  const [loadingClassSections, setLoadingClassSections] = useState(false);
  const [classToPrint, setClassToPrint] = useState(null);

  // Class Form Modal (Create / Edit)
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classFormData, setClassFormData] = useState({ class_name: "", description: "" });
  const [classFormSubmitting, setClassFormSubmitting] = useState(false);
  const [classFormError, setClassFormError] = useState("");

  // Section Form Modal (Create / Edit)
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionFormData, setSectionFormData] = useState({
    class_id: "",
    section_name: "",
    class_teacher: "",
    capacity: 40,
  });
  const [sectionFormSubmitting, setSectionFormSubmitting] = useState(false);
  const [sectionFormError, setSectionFormError] = useState("");

  // Delete Confirm Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'class'|'section', id, name }
  const [deleting, setDeleting] = useState(false);

  // CSV Report Exporter
  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Class ID,Class Name,Description,Total Sections,Total Capacity,Section Name,Capacity,Class Teacher,Created Date\n";

      classes.forEach((cls) => {
        if (!cls.sections || cls.sections.length === 0) {
          csvContent += `"${cls.id}","${cls.class_name}","${cls.description || ""}","0","0","No Sections","0","None","${cls.created_at || ""}"\n`;
        } else {
          cls.sections.forEach((sec) => {
            csvContent += `"${cls.id}","${cls.class_name}","${cls.description || ""}","${cls.section_count}","${cls.total_capacity}","Section ${sec.section_name}","${sec.capacity || 40}","${sec.class_teacher || "Unassigned"}","${sec.created_at || ""}"\n`;
          });
        }
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `EduVerse_Classes_Sections_Report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Classes & Sections CSV report exported successfully!");
    } catch (err) {
      console.error("CSV Export error:", err);
      toast.error("Failed to generate CSV export.");
    }
  };

  // Load all classes & sections
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [classesRes, sectionsRes] = await Promise.all([
        classApi.getAllClasses(),
        sectionApi.getAllSections(),
      ]);

      if (classesRes.success) {
        setClasses(classesRes.data || []);
      }
      if (sectionsRes.success) {
        setAllSections(sectionsRes.data || []);
      }
    } catch (error) {
      console.error("Fetch Classes Error:", error);
      toast.error("Failed to load classes and sections data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load sections for a specific class drawer/modal
  const openClassSectionsModal = async (cls) => {
    setSelectedClassForSections(cls);
    setLoadingClassSections(true);
    try {
      const res = await classApi.getClassSections(cls.id);
      if (res.success) {
        setClassSectionsList(res.data || []);
      }
    } catch (error) {
      console.error("Get Class Sections Error:", error);
      toast.error("Could not load sections for this class.");
    } finally {
      setLoadingClassSections(false);
    }
  };

  // -------------------------------------------------------------
  // Class CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassFormData({ class_name: "", description: "" });
    setClassFormError("");
    setClassModalOpen(true);
  };

  const handleOpenEditClass = (cls) => {
    setEditingClass(cls);
    setClassFormData({ class_name: cls.class_name, description: cls.description || "" });
    setClassFormError("");
    setClassModalOpen(true);
  };

  const handleSubmitClassForm = async (e) => {
    e.preventDefault();
    const trimmedName = classFormData.class_name.trim();
    if (!trimmedName) {
      setClassFormError("Class name is required.");
      return;
    }

    setClassFormSubmitting(true);
    setClassFormError("");

    try {
      if (editingClass) {
        const res = await classApi.updateClass(editingClass.id, {
          class_name: trimmedName,
          description: classFormData.description.trim(),
        });
        if (res.success) {
          toast.success(`Class "${trimmedName}" updated successfully.`);
          setClassModalOpen(false);
          fetchData(true);
        }
      } else {
        const res = await classApi.createClass({
          class_name: trimmedName,
          description: classFormData.description.trim(),
        });
        if (res.success) {
          toast.success(`Class "${trimmedName}" created successfully.`);
          setClassModalOpen(false);
          fetchData(true);
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to save class.";
      setClassFormError(msg);
      toast.error(msg);
    } finally {
      setClassFormSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Section CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenCreateSection = (preselectedClassId = "") => {
    setEditingSection(null);
    setSectionFormData({
      class_id: preselectedClassId || (classes.length > 0 ? String(classes[0].id) : ""),
      section_name: "",
      class_teacher: "",
      capacity: 40,
    });
    setSectionFormError("");
    setSectionModalOpen(true);
  };

  const handleOpenEditSection = (section) => {
    setEditingSection(section);
    setSectionFormData({
      class_id: String(section.class_id),
      section_name: section.section_name,
      class_teacher: section.class_teacher || "",
      capacity: section.capacity || 40,
    });
    setSectionFormError("");
    setSectionModalOpen(true);
  };

  const handleSubmitSectionForm = async (e) => {
    e.preventDefault();
    const trimmedSectionName = sectionFormData.section_name.trim();

    if (!sectionFormData.class_id) {
      setSectionFormError("Please select a parent class.");
      return;
    }
    if (!trimmedSectionName) {
      setSectionFormError("Section name is required.");
      return;
    }

    setSectionFormSubmitting(true);
    setSectionFormError("");

    try {
      const payload = {
        class_id: parseInt(sectionFormData.class_id, 10),
        section_name: trimmedSectionName,
        class_teacher: sectionFormData.class_teacher.trim() || null,
        capacity: parseInt(sectionFormData.capacity, 10) || 40,
      };

      if (editingSection) {
        const res = await sectionApi.updateSection(editingSection.id, payload);
        if (res.success) {
          toast.success(`Section "${trimmedSectionName}" updated successfully.`);
          setSectionModalOpen(false);
          fetchData(true);
          if (selectedClassForSections) {
            openClassSectionsModal(selectedClassForSections);
          }
        }
      } else {
        const res = await sectionApi.createSection(payload);
        if (res.success) {
          toast.success(`Section "${trimmedSectionName}" created successfully.`);
          setSectionModalOpen(false);
          fetchData(true);
          if (selectedClassForSections) {
            openClassSectionsModal(selectedClassForSections);
          }
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to save section.";
      setSectionFormError(msg);
      toast.error(msg);
    } finally {
      setSectionFormSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Delete Handlers
  // -------------------------------------------------------------
  const handleOpenDeleteConfirm = (type, item) => {
    setDeleteTarget({
      type,
      id: item.id,
      name: type === "class" ? item.class_name : `Section ${item.section_name}`,
      extra: type === "class" ? `${item.section_count || 0} associated section(s)` : null,
    });
    setDeleteConfirmOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget.type === "class") {
        const res = await classApi.deleteClass(deleteTarget.id);
        if (res.success) {
          toast.success(`Class "${deleteTarget.name}" deleted successfully.`);
          if (selectedClassForSections?.id === deleteTarget.id) {
            setSelectedClassForSections(null);
          }
          fetchData(true);
        }
      } else {
        const res = await sectionApi.deleteSection(deleteTarget.id);
        if (res.success) {
          toast.success(`${deleteTarget.name} deleted successfully.`);
          fetchData(true);
          if (selectedClassForSections) {
            openClassSectionsModal(selectedClassForSections);
          }
        }
      }
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item.");
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // Filtered Data & Statistics
  // -------------------------------------------------------------
  const filteredClasses = useMemo(() => {
    let result = classes.filter((cls) => {
      const query = searchQuery.toLowerCase();
      const matchName = cls.class_name?.toLowerCase().includes(query);
      const matchDesc = cls.description?.toLowerCase().includes(query);
      return matchName || matchDesc;
    });

    if (sortBy === "most-sections") {
      result.sort((a, b) => (b.section_count || 0) - (a.section_count || 0));
    } else if (sortBy === "least-sections") {
      result.sort((a, b) => (a.section_count || 0) - (b.section_count || 0));
    } else if (sortBy === "highest-capacity") {
      result.sort((a, b) => (b.total_capacity || 0) - (a.total_capacity || 0));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.class_name || "").localeCompare(b.class_name || ""));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => (b.class_name || "").localeCompare(a.class_name || ""));
    }

    return result;
  }, [classes, searchQuery, sortBy]);

  const filteredSections = useMemo(() => {
    return allSections.filter((sec) => {
      const query = searchQuery.toLowerCase();
      const matchName = sec.section_name?.toLowerCase().includes(query);
      const matchTeacher = sec.class_teacher?.toLowerCase().includes(query);
      const matchClass = sec.class_name?.toLowerCase().includes(query);
      const matchClassFilter =
        selectedClassFilter === "all" || String(sec.class_id) === String(selectedClassFilter);

      return (matchName || matchTeacher || matchClass) && matchClassFilter;
    });
  }, [allSections, searchQuery, selectedClassFilter]);

  const totalSectionsCount = useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.section_count || 0), 0);
  }, [classes]);

  const totalCapacitySum = useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.total_capacity || 0), 0);
  }, [classes]);

  const avgSectionsPerClass = useMemo(() => {
    if (classes.length === 0) return "0";
    return (totalSectionsCount / classes.length).toFixed(1);
  }, [classes, totalSectionsCount]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Classes & Sections
            </h1>
            <Badge variant="primary" size="md">
              <Sparkles className="w-3.5 h-3.5" />
              Live Aggregation
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-slate-300 mt-2 font-medium">
            Manage academic batches, inspect dynamic <strong>Section Counts</strong>, and assign class teachers.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export CSV Report Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition-all hover:border-emerald-500/40 shadow-md"
            title="Download CSV Report"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {canManage && (
            <>
              <button
                onClick={() => handleOpenCreateSection()}
                className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold transition-all hover:border-indigo-500/40 shadow-md"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add Section</span>
              </button>

              <button
                onClick={handleOpenCreateClass}
                className="flex items-center gap-2 px-5 py-2.5 sm:py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Class</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Total Classes"
          value={classes.length}
          subtitle="Registered grades"
          icon={School}
          color="indigo"
        />
        <StatCard
          title="Total Sections"
          value={totalSectionsCount}
          subtitle="Active study sections"
          icon={Layers}
          color="emerald"
        />
        <StatCard
          title="Avg Sections / Class"
          value={avgSectionsPerClass}
          subtitle="Distribution ratio"
          icon={Hash}
          color="cyan"
        />
        <StatCard
          title="Total Capacity"
          value={totalCapacitySum}
          subtitle="Total enrolled seats"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Navigation Tabs & Controls Bar */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-slate-800/80 shadow-xl">
        {/* Left: View Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "classes"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <School className="w-4 h-4" />
            <span>Class Cards</span>
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-xs">
              {classes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all-sections")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "all-sections"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Sections Table</span>
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-xs">
              {allSections.length}
            </span>
          </button>
        </div>

        {/* Right: Search & View Switcher */}
        <div className="flex flex-wrap items-center gap-3 flex-1 md:justify-end">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === "classes"
                  ? "Search classes..."
                  : "Search sections, teachers..."
              }
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Sort By Dropdown (Visible in Classes Tab) */}
          {activeTab === "classes" && (
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3.5 pr-8 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-medium"
              >
                <option value="default">Sort: Default</option>
                <option value="most-sections">Sort: Most Sections</option>
                <option value="least-sections">Sort: Least Sections</option>
                <option value="highest-capacity">Sort: Highest Capacity</option>
                <option value="name-asc">Sort: Name (A-Z)</option>
                <option value="name-desc">Sort: Name (Z-A)</option>
              </select>
            </div>
          )}

          {/* Class Filter (Visible in All Sections tab) */}
          {activeTab === "all-sections" && (
            <div className="relative shrink-0">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="pl-3.5 pr-8 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer font-medium"
              >
                <option value="all">Filter: All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Grid / Table View Switcher (Visible in Classes Tab) */}
          {activeTab === "classes" && (
            <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  viewMode === "table"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner text="Fetching classes & sections data..." />
      ) : activeTab === "classes" ? (
        /* ------------------------------------------------------------- */
        /* TAB 1: CLASSES WITH SECTION COUNT VIEW                        */
        /* ------------------------------------------------------------- */
        filteredClasses.length === 0 ? (
          <EmptyState
            icon={School}
            title="No classes found"
            description={
              searchQuery
                ? `No class names matched "${searchQuery}". Try a different keyword.`
                : "No classes have been created yet. Create your first class to get started."
            }
            actionLabel={canManage ? "Create Class" : null}
            onAction={canManage ? handleOpenCreateClass : null}
          />
        ) : viewMode === "grid" ? (
          /* Grid View of Class Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredClasses.map((cls) => {
              const hasSections = cls.section_count > 0;

              return (
                <div
                  key={cls.id}
                  className="glass-card rounded-3xl p-8 sm:p-10 border border-slate-800/80 min-h-[400px] flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/15 hover:border-indigo-500/50 group"
                >
                  <div>
                    {/* Top Row: Class Name & Section Count Badge */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-100 group-hover:text-indigo-300 transition-colors tracking-tight">
                          {cls.class_name}
                        </h3>
                        {cls.description ? (
                          <p className="text-sm sm:text-base text-slate-300 mt-2 line-clamp-2 font-medium">
                            {cls.description}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500 italic mt-2">
                            No description provided
                          </p>
                        )}
                      </div>

                      {/* Prominent Section Count Badge */}
                      <Badge
                        variant={hasSections ? "primary" : "warning"}
                        size="lg"
                        className="shrink-0 font-bold"
                      >
                        <Layers className="w-4 h-4" />
                        <span>
                          {cls.section_count} {cls.section_count === 1 ? "Section" : "Sections"}
                        </span>
                      </Badge>
                    </div>

                    {/* Capacity & Statistics Banner */}
                    <div className="flex items-center gap-4 py-3 px-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 mb-6 text-sm font-semibold">
                      <div className="flex items-center gap-2 text-slate-200">
                        <Users className="w-5 h-5 text-indigo-400 shrink-0" />
                        <span>
                          {cls.total_capacity || 0} Total Seats
                        </span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(cls.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Section Chips Preview */}
                    <div className="space-y-3 mb-8">
                      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
                        Sections in this class:
                      </p>
                      {hasSections ? (
                        <div className="flex flex-wrap gap-2.5">
                          {cls.sections?.map((sec) => (
                            <span
                              key={sec.id}
                              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/90 text-sm font-bold text-slate-100 border border-slate-700/70 hover:border-indigo-500/50 transition-colors shadow-sm"
                            >
                              <span className="text-indigo-300">Sec {sec.section_name}</span>
                              <span className="text-xs text-slate-400 font-medium">({sec.capacity} cap)</span>
                              {sec.class_teacher && (
                                <span className="text-xs text-slate-300 border-l border-slate-700 pl-2 font-normal">
                                  {sec.class_teacher}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-amber-400/90 bg-amber-950/40 border border-amber-500/30 p-4 rounded-2xl italic font-medium">
                          No sections created yet for this class.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-5 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <button
                      onClick={() => openClassSectionsModal(cls)}
                      className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-sm sm:text-base font-bold transition-all shadow-md"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>View Sections ({cls.section_count})</span>
                    </button>

                    <button
                      onClick={() => setClassToPrint(cls)}
                      className="p-3.5 rounded-2xl text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/20 transition-all shadow-sm"
                      title="Print Class Roster"
                    >
                      <Printer className="w-5 h-5" />
                    </button>

                    {canManage && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenCreateSection(cls.id)}
                          className="p-3.5 rounded-2xl text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/20 transition-all"
                          title="Add Section to this Class"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="p-3.5 rounded-2xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800 transition-all"
                          title="Edit Class"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm("class", cls)}
                          className="p-3.5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-all"
                          title="Delete Class"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View of Classes */
          <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Class ID</th>
                    <th className="py-3.5 px-4">Class Name</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Section Count</th>
                    <th className="py-3.5 px-4">Total Capacity</th>
                    <th className="py-3.5 px-4">Sections Preview</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredClasses.map((cls) => (
                    <tr
                      key={cls.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        #{cls.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {cls.class_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                        {cls.description || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={cls.section_count > 0 ? "primary" : "warning"}
                          size="sm"
                        >
                          <Layers className="w-3 h-3" />
                          {cls.section_count} {cls.section_count === 1 ? "Section" : "Sections"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {cls.total_capacity || 0} seats
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cls.sections?.map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded bg-slate-800 text-xs font-medium text-indigo-300 border border-slate-700"
                            >
                              Sec {s.section_name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openClassSectionsModal(cls)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-medium transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => setClassToPrint(cls)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Print Roster"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenCreateSection(cls.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Add Section"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditClass(cls)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Edit Class"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteConfirm("class", cls)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Delete Class"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ------------------------------------------------------------- */
        /* TAB 2: ALL SECTIONS TABLE EXPLORER                            */
        /* ------------------------------------------------------------- */
        filteredSections.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No sections found"
            description={
              searchQuery || selectedClassFilter !== "all"
                ? "No sections match your filter criteria."
                : "No sections created yet. Add your first section."
            }
            actionLabel={canManage ? "Add Section" : null}
            onAction={canManage ? () => handleOpenCreateSection() : null}
          />
        ) : (
          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Section ID</th>
                    <th className="py-3.5 px-4">Section Name</th>
                    <th className="py-3.5 px-4">Parent Class</th>
                    <th className="py-3.5 px-4">Class Teacher</th>
                    <th className="py-3.5 px-4">Capacity</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    {canManage && <th className="py-3.5 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSections.map((sec) => (
                    <tr
                      key={sec.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                        #{sec.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
                          Section {sec.section_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {sec.class_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {sec.class_teacher ? (
                          <span className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            {sec.class_teacher}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Not Assigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {sec.capacity || 40} students
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(sec.created_at).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditSection(sec)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                              title="Edit Section"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm("section", sec)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Section"
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
        )
      )}

      {/* ============================================================= */}
      {/* CLASS SECTIONS EXPLORER MODAL / DRAWER                        */}
      {/* ============================================================= */}
      <Modal
        isOpen={Boolean(selectedClassForSections)}
        onClose={() => setSelectedClassForSections(null)}
        title={selectedClassForSections ? `${selectedClassForSections.class_name} - Sections Explorer` : "Sections Explorer"}
        subtitle="View and manage all individual sections belonging to this class."
        maxWidth="max-w-2xl"
      >
        {selectedClassForSections && (
          <div className="space-y-4">
            {/* Header info bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="md">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{classSectionsList.length} Total Sections</span>
                </Badge>
                <span className="text-xs text-slate-400">
                  {selectedClassForSections.description || "Active Class"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setClassToPrint(selectedClassForSections)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                  title="Print Official Roster"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Roster</span>
                </button>

                {canManage && (
                  <button
                    onClick={() => handleOpenCreateSection(selectedClassForSections.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Section</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sections List */}
            {loadingClassSections ? (
              <LoadingSpinner text="Loading sections..." />
            ) : classSectionsList.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No sections in this class"
                description="This class currently has 0 sections. Add a section to start assigning students and teachers."
                actionLabel={canManage ? "Add First Section" : null}
                onAction={canManage ? () => handleOpenCreateSection(selectedClassForSections.id) : null}
              />
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {classSectionsList.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
                        {sec.section_name}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-200 text-sm">
                            Section {sec.section_name}
                          </h4>
                          <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            {sec.capacity || 40} capacity
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Teacher: {sec.class_teacher || "Not assigned"}</span>
                        </p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditSection(sec)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Section"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteConfirm("section", sec)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================================================= */}
      {/* CREATE / EDIT CLASS MODAL                                     */}
      {/* ============================================================= */}
      <Modal
        isOpen={classModalOpen}
        onClose={() => setClassModalOpen(false)}
        title={editingClass ? "Edit Class" : "Create New Class"}
        subtitle={editingClass ? "Update the class name and description." : "Add a new grade or batch to EduVerse."}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitClassForm} className="space-y-4">
          {classFormError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{classFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Class Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={classFormData.class_name}
              onChange={(e) => setClassFormData({ ...classFormData, class_name: e.target.value })}
              placeholder="e.g. Grade 10 or Grade 12 Science"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={classFormData.description}
              onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
              placeholder="e.g. SEE 2083 Batch or Management Stream"
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setClassModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={classFormSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {classFormSubmitting ? "Saving..." : editingClass ? "Save Changes" : "Create Class"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================= */}
      {/* CREATE / EDIT SECTION MODAL                                   */}
      {/* ============================================================= */}
      <Modal
        isOpen={sectionModalOpen}
        onClose={() => setSectionModalOpen(false)}
        title={editingSection ? "Edit Section" : "Add New Section"}
        subtitle="Configure section name, capacity, and assigned class teacher."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitSectionForm} className="space-y-4">
          {sectionFormError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sectionFormError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Parent Class <span className="text-rose-400">*</span>
            </label>
            <select
              value={sectionFormData.class_id}
              onChange={(e) => setSectionFormData({ ...sectionFormData, class_id: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">Select a Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.section_count || 0} existing sections)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Section Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={sectionFormData.section_name}
                onChange={(e) => setSectionFormData({ ...sectionFormData, section_name: e.target.value })}
                placeholder="e.g. A, B, or Rose"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Student Capacity
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={sectionFormData.capacity}
                onChange={(e) => setSectionFormData({ ...sectionFormData, capacity: e.target.value })}
                placeholder="40"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Class Teacher
            </label>
            <input
              type="text"
              value={sectionFormData.class_teacher}
              onChange={(e) => setSectionFormData({ ...sectionFormData, class_teacher: e.target.value })}
              placeholder="e.g. Sita Sharma"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSectionModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sectionFormSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {sectionFormSubmitting ? "Saving..." : editingSection ? "Save Changes" : "Create Section"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================= */}
      {/* PRINT-READY ROSTER MODAL                                      */}
      {/* ============================================================= */}
      <Modal
        isOpen={Boolean(classToPrint)}
        onClose={() => setClassToPrint(null)}
        title={classToPrint ? `Print Roster: ${classToPrint.class_name}` : "Print Roster"}
        subtitle="Official Class & Section Student Distribution Roster"
        maxWidth="max-w-3xl"
      >
        {classToPrint && (
          <div className="space-y-5">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document</span>
              </button>
            </div>

            {/* Printable Ledger Sheet */}
            <div className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-sm font-sans space-y-4">
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900">
                    EduVerse Educational System
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Official Class Roster & Section Allocation Record
                  </p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p className="font-bold">Academic Session: 2026/2083</p>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 font-semibold uppercase">Class / Grade:</span>
                  <p className="font-bold text-slate-900 text-sm">{classToPrint.class_name}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase">Total Sections:</span>
                  <p className="font-bold text-slate-900 text-sm">{classToPrint.section_count || 0}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase">Total Capacity:</span>
                  <p className="font-bold text-slate-900 text-sm">{classToPrint.total_capacity || 0} Seats</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">#</th>
                    <th className="p-2 border-r border-slate-300">Section Name</th>
                    <th className="p-2 border-r border-slate-300">Capacity</th>
                    <th className="p-2 border-r border-slate-300">Class Teacher</th>
                    <th className="p-2">Teacher Signature / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {!classToPrint.sections || classToPrint.sections.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500 italic">
                        No sections allocated for this class.
                      </td>
                    </tr>
                  ) : (
                    classToPrint.sections.map((sec, idx) => (
                      <tr key={sec.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono border-r border-slate-200">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-900 border-r border-slate-200">
                          Section {sec.section_name}
                        </td>
                        <td className="p-2 border-r border-slate-200">{sec.capacity || 40} seats</td>
                        <td className="p-2 font-medium border-r border-slate-200">
                          {sec.class_teacher || "Not Assigned"}
                        </td>
                        <td className="p-2 text-slate-400 italic">___________________</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pt-6 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200">
                <span>Verified by Academic Administration</span>
                <span>Principal / Controller Signature: _______________________</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================= */}
      {/* DELETE CONFIRMATION MODAL                                     */}
      {/* ============================================================= */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleExecuteDelete}
        loading={deleting}
        title={deleteTarget?.type === "class" ? "Delete Class" : "Delete Section"}
        message={
          deleteTarget?.type === "class"
            ? `Are you sure you want to delete "${deleteTarget?.name}"? WARNING: This will automatically delete all ${deleteTarget?.extra} and exams linked to this class.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
        confirmText="Yes, Delete"
      />
    </div>
  );
};

export default ClassesAndSections;
