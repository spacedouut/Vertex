import { useState } from 'react';
import { APIType } from '../../utils/ModelManager';
import { AddModelModal } from './AddModelModal';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
}

interface CustomModel {
  name: string;
  id: string;
  provider: APIType;
  apiKey: string;
  baseUrl: string;
}

export function SettingsModal({ 
  isOpen, 
  onClose,
  temperature,
  onTemperatureChange,
}: SettingsModalProps) {
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [customModels, setCustomModels] = useState<CustomModel[]>(() => {
    const stored = localStorage.getItem('customModels');
    return stored ? JSON.parse(stored) : [];
  });

  const handleAddModel = (model: CustomModel) => {
    const newModels = [...customModels, model];
    setCustomModels(newModels);
    localStorage.setItem('customModels', JSON.stringify(newModels));
  };

  const handleDeleteModel = (modelId: string) => {
    const newModels = customModels.filter(model => model.id !== modelId);
    setCustomModels(newModels);
    localStorage.setItem('customModels', JSON.stringify(newModels));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h1>Settings</h1>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <h2>Model Settings</h2>
            <h3>Temperature</h3>
            <div className={styles.temperatureControl}>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
              />
              <span>{temperature}</span>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Custom Models</h3>
              <button 
                className={styles.addButton}
                onClick={() => setIsModelModalOpen(true)}
              >
                Add Model
              </button>
            </div>
            <div className={styles.modelsList}>
              {customModels.map((model) => (
                <div key={model.id} className={styles.modelItem}>
                  <div className={styles.modelInfo}>
                    <span className={styles.modelName}>{model.name}</span>
                    <span className={styles.modelProvider}>{APIType[model.provider]}</span>
                  </div>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteModel(model.id)}
                  >
                    Delete
                  </button>
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
    </div>
  );
} 