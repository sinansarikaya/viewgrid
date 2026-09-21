import React, { useMemo, useState } from 'react';
import s from './styles.module.css';
import { useStore } from './store';
import { BUILTIN_DEVICES } from '../../core/devices/builtin';
import type { DeviceCategory } from '../../core/types';

const TABS: { id: DeviceCategory | 'all' | 'fav'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'phone', label: 'Mobile' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'desktop', label: 'Desktop' },
  { id: 'custom', label: 'Custom' },
  { id: 'fav', label: '★' },
];

export function DevicePicker() {
  const st = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('phone');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState({ name: '', width: 390, height: 844, dpr: 3 });

  const all = useMemo(() => [...BUILTIN_DEVICES, ...st.customDevices], [st.customDevices]);
  const list = all.filter((d) => {
    if (tab === 'fav') return d.favorite;
    if (tab !== 'all' && d.category !== tab) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return d.name.toLowerCase().includes(q) || String(d.width).includes(q) || String(d.height).includes(q);
  });

  return (
    <div className={s.overlay} onClick={() => st.setPickerOpen(false)}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Add viewport</h2>
        <div className={s.formRow} style={{ marginTop: 0 }}>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'primary' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
          <input
            className={s.name}
            placeholder="Search name or width…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginLeft: 'auto', width: 180 }}
          />
        </div>

        <div className={s.grid2} style={{ marginTop: 12 }}>
          {list.map((d) => (
            <button
              key={d.id}
              className={s.deviceBtn}
              onClick={() => {
                st.addDevice(d);
                st.setPickerOpen(false);
              }}
            >
              <strong>{d.name}</strong>
              <small>
                {d.width}×{d.height} · DPR {d.devicePixelRatio}
              </small>
            </button>
          ))}
          {list.length === 0 && <div style={{ color: 'var(--text-dim)' }}>No devices match.</div>}
        </div>

        <h2 style={{ marginTop: 18, fontSize: 13 }}>Custom device (W × H × DPR)</h2>
        <div className={s.formRow} style={{ marginTop: 0 }}>
          <input
            className={s.name}
            placeholder="Name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <input
            type="number" min={100} max={10000} value={draft.width}
            onChange={(e) => setDraft({ ...draft, width: Number(e.target.value) })}
            title="Width"
          />
          <input
            type="number" min={100} max={10000} value={draft.height}
            onChange={(e) => setDraft({ ...draft, height: Number(e.target.value) })}
            title="Height"
          />
          <input
            type="number" min={0.5} max={6} step={0.25} value={draft.dpr}
            onChange={(e) => setDraft({ ...draft, dpr: Number(e.target.value) })}
            title="DPR (metadata)"
          />
          <button
            className="primary"
            onClick={() => {
              st.addCustom(draft);
              st.setPickerOpen(false);
            }}
          >
            Save & add
          </button>
        </div>
      </div>
    </div>
  );
}
