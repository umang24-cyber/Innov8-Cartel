import React, { useState, useEffect } from 'react';
import { Clock, User, FileText, Paperclip, Save, MessageSquare, ChevronDown } from 'lucide-react';
import type { Case, Claim } from '../types';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../utils/toast';
import { formatDate, formatRelativeTime } from '../utils/format';
import { formatCurrency } from '../utils/format';

export const CaseManager: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCases();
      setCases(data || []);
      if (data && data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    } catch (error) {
      console.error('Failed to load cases', error);
      toast.error('Failed to load cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCase = async (updates: Partial<Case>) => {
    if (!selectedCase) return;
    try {
      await api.updateCase(selectedCase.id, updates);
      toast.success('Case updated successfully');
      loadCases();
      // Update selected case
      const updated = await api.getCase(selectedCase.id);
      if (updated) setSelectedCase(updated);
    } catch (error) {
      toast.error('Failed to update case');
    }
  };

  const handleAddNote = async (content: string) => {
    if (!selectedCase) return;
    try {
      await api.addCaseNote(selectedCase.id, content);
      toast.success('Note added successfully');
      loadCases();
      const updated = await api.getCase(selectedCase.id);
      if (updated) setSelectedCase(updated);
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const statusColors = {
    Open: 'bg-blue-50 text-blue-700 border-blue-200',
    Investigating: 'bg-amber-50 text-amber-700 border-amber-200',
    Escalated: 'bg-orange-50 text-orange-700 border-orange-200',
    Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const priorityColors = {
    Low: 'bg-slate-50 text-slate-700 border-slate-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Cases List */}
      <div className="w-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Cases</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {cases.length} active cases
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={100} className="mb-2" />)
          ) : cases.length === 0 ? (
            <EmptyState
              title="No cases found"
              description="Cases will appear here when claims are flagged"
            />
          ) : (
            cases.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCase?.id === c.id
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {c.claim_id}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatRelativeTime(c.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={c.priority === 'Critical' ? 'danger' : c.priority === 'High' ? 'warning' : 'info'}
                    size="sm"
                  >
                    {c.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge size="sm" className={statusColors[c.status]}>
                    {c.status}
                  </Badge>
                  {c.assignedTo && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {c.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Case Detail */}
      {selectedCase ? (
        <CaseDetail
          case={selectedCase}
          onUpdate={handleUpdateCase}
          onAddNote={handleAddNote}
        />
      ) : (
        <div className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex items-center justify-center">
          <EmptyState
            title="Select a case"
            description="Choose a case from the list to view details"
          />
        </div>
      )}
    </div>
  );
};

interface CaseDetailProps {
  case: Case;
  onUpdate: (updates: Partial<Case>) => Promise<void>;
  onAddNote: (content: string) => Promise<void>;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ case: caseData, onUpdate, onAddNote }) => {
  const [status, setStatus] = useState(caseData.status);
  const [assignedTo, setAssignedTo] = useState(caseData.assignedTo || '');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStatus(caseData.status);
    setAssignedTo(caseData.assignedTo || '');
    setNoteContent(''); // Reset note input when switching case
  }, [caseData.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ status, assignedTo: assignedTo || undefined });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    await onAddNote(noteContent);
    setNoteContent('');
  };

  const statusColors = {
    Open: 'bg-blue-50 text-blue-700 border-blue-200',
    Investigating: 'bg-amber-50 text-amber-700 border-amber-200',
    Escalated: 'bg-orange-50 text-orange-700 border-orange-200',
    Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Case {caseData.claim_id}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Created {formatDate(caseData.createdAt)}
            </p>
          </div>
          <Badge className={statusColors[caseData.status]}>
            {caseData.status}
          </Badge>
        </div>

        {/* Claim Info */}
        {caseData.claim && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Claim Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Provider
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {caseData.claim.Provider_ID}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Amount
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(caseData.claim.Total_Claim_Amount)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Diagnosis
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {caseData.claim.Diagnosis_Code}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Risk Score
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {caseData.claim.riskScore || 'N/A'}/100
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Explanation */}
        {caseData.claim?.llmAnalysis && (
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-6 border border-teal-200 dark:border-teal-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              AI Analysis
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {caseData.claim.llmAnalysis}
            </p>
          </div>
        )}

        {/* Case Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Case['status'])}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Escalated">Escalated</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Assigned To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Unassigned</option>
              <option value="John Doe">John Doe</option>
              <option value="Jane Smith">Jane Smith</option>
              <option value="Mike Johnson">Mike Johnson</option>
            </select>
          </div>
        </div>

        {/* Notes Section */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Notes
          </h3>
          <form onSubmit={handleAddNoteSubmit} className="mb-4">
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
            />
            <Button type="submit" size="sm">
              <MessageSquare className="w-4 h-4" />
              Add Note
            </Button>
          </form>
          <div className="space-y-3">
            {caseData.notes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {note.author}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {formatRelativeTime(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timeline
          </h3>
          <div className="space-y-3">
            {caseData.timeline.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
              >
                <div className="w-2 h-2 rounded-full bg-teal-500 mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {event.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {event.actor} • {formatRelativeTime(event.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => { }}>
          <Paperclip className="w-4 h-4" />
          Attach Evidence
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

