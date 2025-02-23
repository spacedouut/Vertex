import { useState, useEffect } from 'react';
import { Model } from '../../utils/Dexie';
import { getAllModels } from '../../utils/modelUtils';
import styles from './ModelSelector.module.css';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      const allModels = await getAllModels();
      setModels(allModels);
    };

    loadModels();
  }, []);

  const selectedModelConfig = models.find(model => model.modelId === selectedModel);

  return (
    <div className={styles['model-selector-container']}>
      <div 
        className={styles['model-selector']} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles['selected-model']}>
          {selectedModelConfig?.name || 'Select Model'}
        </span>
        <span className={styles.arrow}>▼</span>
      </div>
      {isOpen && (
        <div className={styles['model-dropdown']}>
          {models.map((model) => (
            <div
              key={model.id}
              className={`${styles['model-option']} ${
                model.modelId === selectedModel ? styles.selected : ''
              }`}
              onClick={() => {
                onModelChange(model.modelId);
                setIsOpen(false);
              }}
            >
              <span className={styles['model-name']}>{model.name}</span>
              <span className={styles['model-provider']}>
                {model.provider}
              </span>
            </div>
          ))}
          {models.length === 0 && (
            <div className={styles['no-models']}>
              No models configured. Add models in settings.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 