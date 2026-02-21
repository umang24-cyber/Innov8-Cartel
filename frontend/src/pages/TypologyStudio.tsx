import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import type { Typology } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../utils/toast';
import { formatDate } from '../utils/format';

export const TypologyStudio: React.FC = () => {
  const [typologies, setTypologies] = useState<Typology[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTypology, setEditingTypology] = useState<Typology | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadTypologies();
  }, []);

  const loadTypologies = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTypologies();
      setTypologies(data || []);
    } catch (error) {
      console.error('Failed to load typologies', error);
      toast.error('Failed to load typologies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Partial<Typology>) => {
    try {
      if (editingTypology) {
        await api.updateTypology(editingTypology.id, data);
        toast.success('Typology updated successfully');
      } else {
        await api.createTypology(data);
        toast.success('Typology created successfully');
      }
      setIsModalOpen(false);
      setEditingTypology(null);
      loadTypologies();
    } catch (error) {
      toast.error('Failed to save typology');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this typology?')) return;
    try {
      await api.deleteTypology(id);
      toast.success('Typology deleted successfully');
      loadTypologies();
    } catch (error) {
      toast.error('Failed to delete typology');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.updateTypology(id, { isActive: !isActive });
      toast.success(`Typology ${!isActive ? 'activated' : 'deactivated'}`);
      loadTypologies();
    } catch (error) {
      toast.error('Failed to update typology');
    }
  };

  const filteredTypologies = typologies.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterActive === 'all' ||
      (filterActive === 'active' && t.isActive) ||
      (filterActive === 'inactive' && !t.isActive);
    return matchesSearch && matchesFilter;
  });

  const severityColors = {
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fraud Typologies</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage fraud detection patterns and risk rules
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTypology(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Create Typology
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search typologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterActive(filter)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                filterActive === filter
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Typologies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} height={200} />
          ))}
        </div>
      ) : filteredTypologies.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-8 h-8" />}
          title="No typologies found"
          description={searchQuery ? "Try adjusting your search query" : "Create your first fraud typology to get started"}
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Typology
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypologies.map((typology) => (
            <div
              key={typology.id}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {typology.name}
                    </h3>
                    <Badge
                      variant={typology.severity === 'Critical' ? 'danger' : typology.severity === 'High' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {typology.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {typology.description}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleActive(typology.id, typology.isActive)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {typology.isActive ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Risk Weight</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {typology.riskWeight}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Frequency</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {typology.frequency} triggers
                  </span>
                </div>
                {typology.lastTriggered && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Last Triggered</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(typology.lastTriggered)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTypology(typology);
                    setIsModalOpen(true);
                  }}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(typology.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <TypologyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTypology(null);
        }}
        onSave={handleSave}
        typology={editingTypology}
      />
    </div>
  );
};

interface TypologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Typology>) => Promise<void>;
  typology: Typology | null;
}

const TypologyModal: React.FC<TypologyModalProps> = ({ isOpen, onClose, onSave, typology }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    riskWeight: 50,
    severity: 'Medium' as Typology['severity'],
    rules: [''],
    isActive: true,
  });

  useEffect(() => {
    if (typology) {
      setFormData({
        name: typology.name,
        description: typology.description,
        riskWeight: typology.riskWeight,
        severity: typology.severity,
        rules: typology.rules.length > 0 ? typology.rules : [''],
        isActive: typology.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        riskWeight: 50,
        severity: 'Medium',
        rules: [''],
        isActive: true,
      });
    }
  }, [typology, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      rules: formData.rules.filter(r => r.trim() !== ''),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={typology ? 'Edit Typology' : 'Create Typology'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Name
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Description
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Risk Weight (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={formData.riskWeight}
              onChange={(e) => setFormData({ ...formData, riskWeight: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as Typology['severity'] })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Detection Rules
          </label>
          {formData.rules.map((rule, index) => (
            <input
              key={index}
              type="text"
              value={rule}
              onChange={(e) => {
                const newRules = [...formData.rules];
                newRules[index] = e.target.value;
                setFormData({ ...formData, rules: newRules });
              }}
              placeholder="Enter detection rule..."
              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 mb-2"
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFormData({ ...formData, rules: [...formData.rules, ''] })}
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Typology</Button>
        </div>
      </form>
    </Modal>
  );
};

