import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { APIType } from '../../utils/ModelManager';
import styles from './SettingsModal.module.css';

interface AddModelModalProps {
  onClose: () => void;
  onAdd: (model: {
    name: string;
    id: string;
    provider: APIType;
    apiKey: string;
    baseUrl: string;
    modelId: string;
  }) => void;
}

export function AddModelModal({ onClose, onAdd }: AddModelModalProps) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<APIType>(APIType.OpenAI);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelId, setModelId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: uuidv4(),
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
          <h2>Add Custom Model</h2>
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
              Add Model
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 