import { useState, useEffect } from 'react';
import { APIType } from '../../utils/ModelManager';
import styles from './ModelSelector.module.css';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

interface CustomModel {
  id: string;
  name: string;
  provider: APIType;
  apiKey: string;
  baseUrl: string;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);

  useEffect(() => {
    const loadCustomModels = () => {
      const stored = localStorage.getItem('customModels');
      if (stored) {
        setCustomModels(JSON.parse(stored));
      }
    };

    loadCustomModels();
    // Listen for changes in localStorage
    window.addEventListener('storage', loadCustomModels);
    
    return () => {
      window.removeEventListener('storage', loadCustomModels);
    };
  }, []);

  const selectedModelConfig = customModels.find(model => model.id === selectedModel);

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
          {customModels.map((model) => (
            <div
              key={model.id}
              className={`${styles['model-option']} ${
                model.id === selectedModel ? styles.selected : ''
              }`}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
            >
              <span className={styles['model-name']}>{model.name}</span>
              <span className={styles['model-provider']}>
                {APIType[model.provider]}
              </span>
            </div>
          ))}
          {customModels.length === 0 && (
            <div className={styles['no-models']}>
              No models configured. Add models in settings.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 