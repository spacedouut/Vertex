import { useState, useEffect } from 'react';
import { APIType } from '../../utils/ModelManager';
import { AddModelModal } from './AddModelModal';
import { EditModelModal } from './EditModelModal';
import { Model } from '../../utils/Dexie';
import { getAllModels, addModel, updateModel, deleteModel } from '../../utils/modelUtils';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
}

export function SettingsModal({ 
  isOpen, 
  onClose,
  temperature,
  onTemperatureChange,
}: SettingsModalProps) {
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modelToEdit, setModelToEdit] = useState<Model | null>(null);
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      const allModels = await getAllModels();
      setModels(allModels);
    };

    loadModels();
  }, [isOpen]);

  const handleAddModel = async (modelData: Omit<Model, 'id' | 'timestamp'>) => {
    const modelId = await addModel(modelData);
    const allModels = await getAllModels();
    setModels(allModels);
    setIsModelModalOpen(false);
  };

  const handleEditModel = async (modelData: Model) => {
    if (!modelData.id) return;
    await updateModel(modelData.id, modelData);
    const allModels = await getAllModels();
    setModels(allModels);
    setIsEditModalOpen(false);
    setModelToEdit(null);
  };

  const handleDeleteModel = async (modelId: number) => {
    await deleteModel(modelId);
    const allModels = await getAllModels();
    setModels(allModels);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>Temperature</h3>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.temperatureValue}>{temperature}</div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Models</h3>
              <button 
                className={styles.addButton}
                onClick={() => setIsModelModalOpen(true)}
              >
                Add Model
              </button>
            </div>
            <div className={styles.modelsList}>
              {models.map((model) => (
                <div key={model.id} className={styles.modelItem}>
                  <div className={styles.modelInfo}>
                    <span className={styles.modelName}>{model.name}</span>
                    <span className={styles.modelProvider}>{model.provider}</span>
                  </div>
                  <div className={styles.modelActions}>
                    <button
                      className={styles.editButton}
                      onClick={() => {
                        setModelToEdit(model);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => model.id && handleDeleteModel(model.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isModelModalOpen && (
        <AddModelModal
          onClose={() => setIsModelModalOpen(false)}
          onAdd={handleAddModel}
        />
      )}

      {isEditModalOpen && modelToEdit && (
        <EditModelModal
          onClose={() => {
            setIsEditModalOpen(false);
            setModelToEdit(null);
          }}
          onSave={handleEditModel}
          model={modelToEdit}
        />
      )}
    </div>
  );
} 