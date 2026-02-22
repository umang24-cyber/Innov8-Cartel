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

interface CaseManagerProps {
  investigatedClaims?: Claim[];
}

export const CaseManager: React.FC<CaseManagerProps> = ({ investigatedClaims = [] }) => {
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

  // Build synthetic cases from investigated claims that are not already in the API cases
  const investigatedCases: Case[] = investigatedClaims
    .filter(claim => !cases.some(c => c.claim_id === claim.claim_id))
    .map(claim => ({
      id: `case-${claim.claim_id}`,
      claim_id: claim.claim_id,
      claim: claim,
      status: claim.status === 'Done' ? 'Closed' as const : 'Investigating' as const,
      assignedTo: undefined,
      priority: (claim.riskLevel === 'Critical' ? 'Critical' :
        claim.riskLevel === 'High' ? 'High' :
          claim.riskLevel === 'Medium' ? 'Medium' : 'Low') as Case['priority'],
      notes: [],
      timeline: [{
        id: `tl-${claim.claim_id}-1`,
        type: 'status_change' as const,
        actor: 'VeriClaim AI',
        description: `Claim ${claim.claim_id} investigated via Alert Queue (Risk: ${claim.riskScore}/100)`,
        timestamp: new Date().toISOString(),
      }],
      createdAt: claim.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  const allCases = [...cases, ...investigatedCases];

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
            {allCases.length} active cases
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={100} className="mb-2" />)
          ) : allCases.length === 0 ? (
            <EmptyState
              title="No cases found"
              description="Cases will appear here when claims are flagged"
            />
          ) : (
            allCases.map((c) => (
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

interface EvidenceItem {
  id: string;
  type: 'file' | 'link';
  name: string;
  url: string; // data URI for files, URL for links
  addedAt: string;
}

const DEFAULT_ASSIGNEES = [
  'Arjun Sharma',
  'Priya Patel',
  'Vikram Mehta',
  'Sneha Iyer',
  'Rahul Gupta',
];

const getStoredAssignees = (): string[] => {
  try {
    const raw = localStorage.getItem('vericlaim_custom_assignees');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const getStoredEvidence = (caseId: string): EvidenceItem[] => {
  try {
    const raw = localStorage.getItem(`vericlaim_evidence_${caseId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const CaseDetail: React.FC<CaseDetailProps> = ({ case: caseData, onUpdate, onAddNote }) => {
  const [status, setStatus] = useState(caseData.status);
  const [assignedTo, setAssignedTo] = useState(caseData.assignedTo || '');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Assignee management
  const [customAssignees, setCustomAssignees] = useState<string[]>(getStoredAssignees());
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  // Evidence management
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(getStoredEvidence(caseData.id));
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkName, setNewLinkName] = useState('');

  useEffect(() => {
    setStatus(caseData.status);
    setAssignedTo(caseData.assignedTo || '');
    setNoteContent('');
    setEvidenceItems(getStoredEvidence(caseData.id));
  }, [caseData.id]);

  const allAssignees = [...DEFAULT_ASSIGNEES, ...customAssignees];

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

  const handleAddPerson = () => {
    const name = newPersonName.trim();
    if (!name || allAssignees.includes(name)) {
      setNewPersonName('');
      setShowAddPerson(false);
      return;
    }
    const updated = [...customAssignees, name];
    setCustomAssignees(updated);
    localStorage.setItem('vericlaim_custom_assignees', JSON.stringify(updated));
    setAssignedTo(name);
    setNewPersonName('');
    setShowAddPerson(false);
    toast.success(`${name} added to assignees`);
  };

  // Evidence helpers
  const saveEvidence = (items: EvidenceItem[]) => {
    setEvidenceItems(items);
    localStorage.setItem(`vericlaim_evidence_${caseData.id}`, JSON.stringify(items));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newItem: EvidenceItem = {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'file',
          name: file.name,
          url: reader.result as string,
          addedAt: new Date().toISOString(),
        };
        saveEvidence([...evidenceItems, newItem]);
        toast.success(`File "${file.name}" attached`);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddLink = () => {
    const url = newLinkUrl.trim();
    const name = newLinkName.trim() || url;
    if (!url) return;
    const newItem: EvidenceItem = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'link',
      name,
      url,
      addedAt: new Date().toISOString(),
    };
    saveEvidence([...evidenceItems, newItem]);
    setNewLinkUrl('');
    setNewLinkName('');
    toast.success('Link added as evidence');
  };

  const handleRemoveEvidence = (id: string) => {
    const updated = evidenceItems.filter(e => e.id !== id);
    saveEvidence(updated);
    toast.info('Evidence removed');
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
            <div className="flex gap-2">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Unassigned</option>
                {allAssignees.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowAddPerson(!showAddPerson)}
                className="px-3 py-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors font-bold text-lg"
                title="Add new person"
              >
                +
              </button>
            </div>
            {showAddPerson && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Enter name..."
                  className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                />
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="px-3 py-1.5 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Section */}
        {evidenceItems.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5" />
              Attached Evidence ({evidenceItems.length})
            </h3>
            <div className="space-y-2">
              {evidenceItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-bold rounded-md ${item.type === 'file' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'}`}>
                      {item.type === 'file' ? 'FILE' : 'LINK'}
                    </span>
                    {item.type === 'link' ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline truncate">
                        {item.name}
                      </a>
                    ) : (
                      <a href={item.url} download={item.name} className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline truncate">
                        {item.name}
                      </a>
                    )}
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatRelativeTime(item.addedAt)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveEvidence(item.id)}
                    className="flex-shrink-0 ml-2 text-xs text-rose-500 hover:text-rose-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <Button variant="outline" onClick={() => setShowEvidenceModal(!showEvidenceModal)}>
          <Paperclip className="w-4 h-4" />
          Attach Evidence
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEvidenceModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-teal-600" />
                Attach Evidence
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload files or add links as evidence for this case</p>
            </div>
            <div className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Upload Files</label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors">
                  <div className="text-center">
                    <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Click to upload or drag files</p>
                    <p className="text-xs text-slate-400">PDF, images, documents, spreadsheets</p>
                  </div>
                  <input type="file" className="hidden" multiple onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.csv,.txt" />
                </label>
              </div>

              {/* Link Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Add Link</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newLinkName}
                    onChange={e => setNewLinkName(e.target.value)}
                    placeholder="Link label (optional)"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newLinkUrl}
                      onChange={e => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                    />
                    <button
                      type="button"
                      onClick={handleAddLink}
                      disabled={!newLinkUrl.trim()}
                      className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Evidence in Modal */}
              {evidenceItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Attached ({evidenceItems.length})</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {evidenceItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${item.type === 'file' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'}`}>
                            {item.type === 'file' ? '📄' : '🔗'}
                          </span>
                          <span className="truncate text-slate-700 dark:text-slate-300">{item.name}</span>
                        </div>
                        <button onClick={() => handleRemoveEvidence(item.id)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold flex-shrink-0 ml-2">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowEvidenceModal(false)}
                className="px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

