import { useState } from 'react';
import { APIType } from '../../utils/ModelManager';
import styles from './SettingsModal.module.css';

interface EditModelModalProps {
  onClose: () => void;
  onSave: (model: {
    id: string;
    name: string;
    provider: APIType;
    apiKey: string;
    baseUrl: string;
    modelId: string;
  }) => void;
  model: {
    id: string;
    name: string;
    provider: APIType;
    apiKey: string;
    baseUrl: string;
    modelId: string;
  };
}

export function EditModelModal({ onClose, onSave, model }: EditModelModalProps) {
  const [name, setName] = useState(model.name);
  const [provider, setProvider] = useState<APIType>(model.provider);
  const [apiKey, setApiKey] = useState(model.apiKey);
  const [baseUrl, setBaseUrl] = useState(model.baseUrl);
  const [modelId, setModelId] = useState(model.modelId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: model.id,
      name,
      provider,
      apiKey,
      baseUrl,
      modelId,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.addModelModal}>
        <div className={styles.header}>
          <h2>Edit Model</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Display Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a friendly name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="modelId">Model ID</label>
            <input
              id="modelId"
              type="text"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="e.g., gpt-4, claude-3-opus"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="provider">API Provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(parseInt(e.target.value))}
            >
              {Object.entries(APIType)
                .filter(([key]) => isNaN(Number(key)))
                .map(([key, value]) => (
                  <option key={value} value={value}>
                    {key}
                  </option>
                ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="baseUrl">Base URL (Optional)</label>
            <input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Enter base URL if different from default"
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 