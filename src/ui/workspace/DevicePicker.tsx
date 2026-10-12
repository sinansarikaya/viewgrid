import React, { useMemo, useState } from 'react';
import { Icon } from '../common/Icon';
import { useStore } from './store';
import { MAX_VIEWPORTS, type DeviceCategory, type Orientation } from '../../core/types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DEVICE_CATALOG, filterCatalog, type DeviceBrand, type DeviceCatalogItem } from '../../core/devices/catalog';
import { getDevicePickerTranslation } from './device-picker-i18n';
import s from './DevicePicker.module.css';

export function DevicePicker() {
  const st = useStore();
  const t = getDevicePickerTranslation(st.language);

  const [activeCategory, setActiveCategory] = useState<DeviceCategory | 'all' | 'favorite' | 'recent'>('all');
  const [activeBrand, setActiveBrand] = useState<DeviceBrand | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDirection, setSelectedDirection] = useState<Orientation | 'default'>('default');

  // Custom device draft & validation error
  const [customDraft, setCustomDraft] = useState({
    name: '',
    width: '390',
    height: '844',
    dpr: '3',
  });
  const [customError, setCustomError] = useState<string | null>(null);

  // Device group name draft
  const [groupNameInput, setGroupNameInput] = useState('');

  const currentCount = st.model.viewports.length;
  const remainingSlots = Math.max(0, MAX_VIEWPORTS - currentCount);
  const isLimitReached = remainingSlots <= 0;

  // Filtered devices list
  const filteredDevices = useMemo(() => {
    return filterCatalog({
      category: activeCategory,
      brand: activeBrand,
      query: searchQuery,
      favoriteIds: st.favoriteDeviceIds || [],
      recentIds: st.recentDeviceIds || [],
      customDevices: st.customDevices || [],
    });
  }, [
    activeCategory,
    activeBrand,
    searchQuery,
    st.favoriteDeviceIds,
    st.recentDeviceIds,
    st.customDevices,
  ]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size < remainingSlots) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const selectGroup = (ids: string[]) => {
    const next = new Set<string>();
    for (const id of ids) {
      if (next.size < remainingSlots) {
        next.add(id);
      }
    }
    setSelectedIds(next);
  };

  const handleCommitAdd = () => {
    if (selectedIds.size === 0) return;
    const all = [...DEVICE_CATALOG, ...(st.customDevices || [])];
    let addedCount = 0;

    for (const id of selectedIds) {
      if (currentCount + addedCount >= MAX_VIEWPORTS) break;
      const device = all.find((d) => d.id === id);
      if (device) {
        st.addDevice(device, selectedDirection === 'default' ? device.defaultOrientation : selectedDirection);
        addedCount += 1;
      }
    }

    st.setPickerOpen(false);
  };

  const handleAddSingle = (device: (typeof filteredDevices)[0]) => {
    if (isLimitReached) return;
    st.addDevice(device, selectedDirection === 'default' ? device.defaultOrientation : selectedDirection);
    st.setPickerOpen(false);
  };

  const handleCreateCustom = () => {
    setCustomError(null);
    const name = customDraft.name.trim();
    if (!name) {
      setCustomError(t.errCustomNameRequired);
      return;
    }

    const w = Number(customDraft.width);
    if (!Number.isFinite(w) || isNaN(w) || w < 100 || w > 10000) {
      setCustomError(t.errCustomWidthInvalid);
      return;
    }

    const h = Number(customDraft.height);
    if (!Number.isFinite(h) || isNaN(h) || h < 100 || h > 10000) {
      setCustomError(t.errCustomHeightInvalid);
      return;
    }

    const dpr = Number(customDraft.dpr);
    if (!Number.isFinite(dpr) || isNaN(dpr) || dpr < 0.5 || dpr > 6) {
      setCustomError(t.errCustomDprInvalid);
      return;
    }

    st.addCustom({ name, width: Math.floor(w), height: Math.floor(h), dpr });
    st.setPickerOpen(false);
  };

  const handleSaveGroup = () => {
    const name = groupNameInput.trim();
    if (!name || selectedIds.size === 0) return;
    st.saveDeviceGroup(name, Array.from(selectedIds));
    setGroupNameInput('');
  };

  // Helper for verification badge rendering
  const renderVerificationBadge = (device: DeviceCatalogItem) => {
    switch (device.verification) {
      case 'descriptor-screen':
        return (
          <span
            className={`${s.verifBadge} ${s.verifDescriptor}`}
            title={`${t.verifDescriptorTooltip}${device.verifiedAt ? ` (${device.verifiedAt})` : ''}`}
          >
            {t.verifDescriptor}
          </span>
        );
      case 'layout-preset':
        return (
          <span
            className={`${s.verifBadge} ${s.verifLayoutPreset}`}
            title={t.verifLayoutPresetTooltip}
          >
            {t.verifLayoutPreset}
          </span>
        );
      case 'user-defined':
        return (
          <span
            className={`${s.verifBadge} ${s.verifUserDefined}`}
            title={t.verifUserDefinedTooltip}
          >
            {t.verifUserDefined}
          </span>
        );
      case 'unverified':
      default:
        return (
          <span
            className={`${s.verifBadge} ${s.verifUnverified}`}
            title={t.verifUnverifiedTooltip}
          >
            {t.verifUnverified}
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={st.pickerOpen}
      onClose={() => st.setPickerOpen(false)}
      title={t.title}
      ariaLabel={t.title}
    >
      <div className={s.container}>
        {/* Search Bar */}
        <div className={s.searchBar}>
          <input
            className={s.searchInput}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t.searchPlaceholder}
          />
        </div>

        {/* Category Tabs */}
        <div className={s.categoryTabs} role="group" aria-label="Device categories">
          {[
            { id: 'all' as const, label: t.all },
            { id: 'phone' as const, label: t.phones },
            { id: 'tablet' as const, label: t.tablets },
            { id: 'laptop' as const, label: t.laptops },
            { id: 'desktop' as const, label: t.desktops },
            { id: 'custom' as const, label: t.custom },
            { id: 'favorite' as const, label: t.favorites },
            { id: 'recent' as const, label: t.recents },
          ].map((cat) => (
            <Button
              key={cat.id}
              variant="default"
              className={[s.tabBtn, activeCategory === cat.id ? s.tabBtnActive : ''].join(' ')}
              aria-pressed={activeCategory === cat.id}
              onClick={() => { setActiveCategory(cat.id); setActiveBrand('all'); }}
            >
              {cat.label}
              {cat.id === 'favorite' && <Icon name="star" />}
            </Button>
          ))}
        </div>

        {/* Brand Filters (Brand label localized, Phone/Tablet/All context) */}
        {(activeCategory === 'all' || activeCategory === 'phone' || activeCategory === 'tablet') && (
          <div className={s.brandFilters}>
            <span className={s.brandLabel}>{t.brandLabel}:</span>
            {[
              { id: 'all' as const, label: t.brandAll },
              { id: 'apple' as const, label: t.brandApple },
              { id: 'google' as const, label: t.brandGoogle },
              { id: 'samsung' as const, label: t.brandSamsung },
            ].map((brand) => (
              <Button
                key={brand.id}
                variant="default"
                className={[s.brandChip, activeBrand === brand.id ? s.brandChipActive : ''].join(' ')}
                aria-pressed={activeBrand === brand.id}
                onClick={() => setActiveBrand(brand.id)}
              >
                {brand.label}
              </Button>
            ))}
          </div>
        )}

        {/* Slot Limits Status */}
        <div className={s.slotInfo}>
          <span>{t.slotsRemaining(remainingSlots, MAX_VIEWPORTS)}</span>
          {isLimitReached && <span className={s.slotWarning}>{t.limitReached(MAX_VIEWPORTS)}</span>}
        </div>

        {/* Devices Grid */}
        <div className={s.deviceGrid} role="list" aria-label="Device list">
          {filteredDevices.length === 0 ? (
            <div className={s.emptyList}>{t.noDevicesFound}</div>
          ) : (
            filteredDevices.map((device) => {
              const isSelected = selectedIds.has(device.id);
              const isFav = (st.favoriteDeviceIds || []).includes(device.id);

              return (
                <div
                  key={device.id}
                  className={[s.deviceCard, isSelected ? s.deviceCardSelected : ''].join(' ')}
                  role="listitem"
                >
                  <label className={s.cardSelectArea}>
                    <input
                      type="checkbox"
                      className={s.checkbox}
                      checked={isSelected}
                      disabled={isLimitReached && !isSelected}
                      onChange={() => toggleSelect(device.id)}
                      aria-label={t.ariaSelectDevice(device.name)}
                    />
                    <div className={s.cardBody}>
                      <div className={s.cardHeaderRow}>
                        <span className={s.deviceName} title={device.name}>
                          {device.name}
                        </span>
                        {renderVerificationBadge(device)}
                      </div>
                      <div className={s.deviceMeta}>
                        <span>{device.width}×{device.height} px</span>
                        <span>·</span>
                        <span>DPR {device.devicePixelRatio}</span>
                        <span>·</span>
                        <span className={s.orientationMeta}>
                          {t.defaultOrientationLabel(device.defaultOrientation)}
                        </span>
                      </div>
                    </div>
                  </label>

                  <div className={s.cardActions}>
                    <Button
                      variant="default"
                      iconOnly
                      className={[s.favBtn, isFav ? s.favBtnActive : ''].join(' ')}
                      onClick={() => st.toggleDeviceFavorite(device.id)}
                      title={t.ariaFavoriteTitle}
                      aria-label={t.ariaToggleFavorite(device.name)}
                      aria-pressed={isFav}
                    >
                      <Icon name={isFav ? "starFilled" : "star"} />
                    </Button>

                    <Button
                      variant="default"
                      className={s.actionBtn}
                      disabled={isLimitReached}
                      onClick={() => handleAddSingle(device)}
                      title={t.addDevice}
                      aria-label={t.ariaAddSingle(device.name)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Multi-selection Action Bar */}
        <div className={s.actionBar}>
          <div className={s.directionControls}>
            <span>{t.direction}:</span>
            <select
              className={s.directionSelect}
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value as Orientation | 'default')}
              aria-label={t.direction}
            >
              <option value="default">{st.language === 'tr' ? 'Cihazın varsayılanı' : st.language === 'no' ? 'Enhetens standard' : 'Device default'}</option>
              <option value="portrait">{t.portrait}</option>
              <option value="landscape">{t.landscape}</option>
            </select>
          </div>

          <Button
            variant="primary"
            disabled={selectedIds.size === 0 || isLimitReached}
            onClick={handleCommitAdd}
          >
            {selectedIds.size > 0 ? t.addSelected(selectedIds.size) : t.addDevice}
          </Button>
        </div>

        {/* Device Groups Section */}
        <div className={s.groupsSection}>
          <div className={s.sectionHeader}>{t.groupsTitle}</div>
          <div className={s.groupRow}>
            <input
              className={s.inputName}
              placeholder={t.groupNamePlaceholder}
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              aria-label={t.groupNamePlaceholder}
            />
            <Button
              variant="default"
              disabled={selectedIds.size === 0 || !groupNameInput.trim()}
              onClick={handleSaveGroup}
            >
              {t.saveGroupBtn}
            </Button>
          </div>

          {st.deviceGroups && Object.keys(st.deviceGroups).length > 0 && (
            <div className={s.groupList}>
              {Object.entries(st.deviceGroups).map(([name, ids]) => (
                <div key={name} className={s.groupItem}>
                  <span>
                    <strong>{name}</strong> ({ids.length})
                  </span>
                  <div className={s.cardActions}>
                    <Button
                      variant="default"
                      className={s.actionBtn}
                      onClick={() => selectGroup(ids)}
                    >
                      {t.loadGroupBtn}
                    </Button>
                    <Button
                      variant="danger"
                      iconOnly
                      className={s.actionBtn}
                      onClick={() => st.deleteDeviceGroup(name)}
                      aria-label={t.ariaDeleteGroup(name)}
                    >
                      <Icon name="close" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Custom Device Section with Explicit Validation */}
        <div className={s.customSection}>
          <div className={s.sectionHeader}>{t.customSectionTitle}</div>
          {customError && (
            <div className={s.validationError} role="alert">
              {customError}
            </div>
          )}
          <div className={s.customFormRow}>
            <input
              className={s.inputName}
              placeholder={t.deviceName}
              value={customDraft.name}
              onChange={(e) => {
                setCustomDraft({ ...customDraft, name: e.target.value });
                if (customError) setCustomError(null);
              }}
              aria-label={t.deviceName}
            />
            <input
              type="number"
              className={s.inputNum}
              min={100}
              max={10000}
              placeholder={t.width}
              value={customDraft.width}
              onChange={(e) => {
                setCustomDraft({ ...customDraft, width: e.target.value });
                if (customError) setCustomError(null);
              }}
              aria-label={t.width}
            />
            <input
              type="number"
              className={s.inputNum}
              min={100}
              max={10000}
              placeholder={t.height}
              value={customDraft.height}
              onChange={(e) => {
                setCustomDraft({ ...customDraft, height: e.target.value });
                if (customError) setCustomError(null);
              }}
              aria-label={t.height}
            />
            <input
              type="number"
              className={s.inputNum}
              min={0.5}
              max={6}
              step={0.25}
              placeholder={t.dpr}
              value={customDraft.dpr}
              onChange={(e) => {
                setCustomDraft({ ...customDraft, dpr: e.target.value });
                if (customError) setCustomError(null);
              }}
              aria-label={t.dpr}
            />
            <Button
              variant="default"
              disabled={isLimitReached}
              onClick={handleCreateCustom}
            >
              {t.addCustom}
            </Button>
          </div>
        </div>

        {/* Provenance and Testing Disclaimer */}
        <div className={s.disclaimer}>
          {t.provenanceDisclaimer}
        </div>
      </div>
    </Modal>
  );
}
