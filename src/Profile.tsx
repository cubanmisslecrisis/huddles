import { useState, useMemo } from 'react';
import './Profile.css';

const BODY_COLORS = [
  { name: 'Ice Blue', hex: '#7FD1FF' },
  { name: 'Aurora Pink', hex: '#FFB3C7' },
  { name: 'Sun Yellow', hex: '#FFE08A' },
  { name: 'Mint Green', hex: '#B5E8A0' },
  { name: 'Arctic Purple', hex: '#C9B6FF' },
  { name: 'Warm Orange', hex: '#FFC09A' },
  { name: 'Aqua Teal', hex: '#9AE6D0' },
  { name: 'Coral', hex: '#FF9AA2' },
];

const ACCESSORIES = {
  heads: [
    { id: 'beanie', name: '🧢 Beanie', emoji: '🧢' },
    { id: 'crown', name: '👑 Crown', emoji: '👑' },
    { id: 'hat', name: '🎩 Top Hat', emoji: '🎩' },
    { id: 'viking', name: '⚔️ Viking Helmet', emoji: '⚔️' },
  ],
  tops: [
    { id: 'hoodie', name: '🧥 Hoodie', emoji: '🧥' },
    { id: 'tshirt', name: '👕 T-Shirt', emoji: '👕' },
    { id: 'sweater', name: '🧶 Sweater', emoji: '🧶' },
    { id: 'dress', name: '👗 Dress', emoji: '👗' },
  ],
  bottoms: [
    { id: 'jeans', name: '👖 Jeans', emoji: '👖' },
    { id: 'shorts', name: '🩳 Shorts', emoji: '🩳' },
    { id: 'skirt', name: '👚 Skirt', emoji: '👚' },
  ],
  feet: [
    { id: 'sneakers', name: '👟 Sneakers', emoji: '👟' },
    { id: 'boots', name: '🥾 Boots', emoji: '🥾' },
    { id: 'skates', name: '🛼 Roller Skates', emoji: '🛼' },
  ],
  accessories: [
    { id: 'headphones', name: '🎧 Headphones', emoji: '🎧' },
    { id: 'scarf', name: '🧣 Scarf', emoji: '🧣' },
    { id: 'bag', name: '👜 Bag', emoji: '👜' },
    { id: 'necklace', name: '📿 Necklace', emoji: '📿' },
  ],
};

type CustomizationState = {
  head?: string;
  top?: string;
  bottom?: string;
  feet?: string;
  accessory?: string;
};

function CustomPenguin({
  color,
  customization,
}: {
  color: string;
  customization: CustomizationState;
}) {
  return (
    <div className="custom-penguin-display">
      <div
        className="penguin-body"
        style={{
          background: color,
        }}
      >
        🐧
      </div>
      <div className="penguin-accessories">
        {customization.head && <span className="accessory head">{customization.head}</span>}
        {customization.top && <span className="accessory top">{customization.top}</span>}
        {customization.bottom && <span className="accessory bottom">{customization.bottom}</span>}
        {customization.feet && <span className="accessory feet">{customization.feet}</span>}
        {customization.accessory && <span className="accessory acc">{customization.accessory}</span>}
      </div>
    </div>
  );
}

interface ProfileProps {
  name: string;
  penguinColor: string;
  totalHuddles: number;
  totalWarmth: number;
  friendCount: number;
  territoryClaimed: number;
  onColorChange: (color: string) => void;
}

export default function Profile({
  name,
  penguinColor,
  totalHuddles,
  totalWarmth,
  friendCount,
  territoryClaimed,
  onColorChange,
}: ProfileProps) {
  const [customization, setCustomization] = useState<CustomizationState>({});
  const [expandedSection, setExpandedSection] = useState<string | null>('colors');

  const totalPoints = Math.round(totalWarmth);

  return (
    <div className="profile-screen">
      <div className="profile-header">
        <h1>Profile</h1>
        <p className="username">{name}</p>
      </div>

      <div className="penguin-showcase">
        <CustomPenguin color={penguinColor} customization={customization} />
        <p className="showcase-label">Your Penguin</p>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-value">{totalPoints}</span>
          <span className="stat-label">Huddle Points</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{friendCount}</span>
          <span className="stat-label">Friends</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{territoryClaimed}</span>
          <span className="stat-label">Territories</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalHuddles}</span>
          <span className="stat-label">Huddles</span>
        </div>
      </div>

      <div className="customization-section">
        <h2>Customize</h2>

        {/* Body Colors */}
        <div className="customization-group">
          <button
            className={`group-header ${expandedSection === 'colors' ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'colors' ? null : 'colors')}
          >
            <span>🎨 Penguin Color</span>
            <span className="toggle">›</span>
          </button>
          {expandedSection === 'colors' && (
            <div className="color-grid">
              {BODY_COLORS.map((color) => (
                <button
                  key={color.hex}
                  className={`color-swatch ${penguinColor === color.hex ? 'selected' : ''}`}
                  style={{ background: color.hex }}
                  onClick={() => onColorChange(color.hex)}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Head Accessories */}
        <div className="customization-group">
          <button
            className={`group-header ${expandedSection === 'head' ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'head' ? null : 'head')}
          >
            <span>🎀 Head Gear</span>
            {customization.head && <span className="selected-item">{customization.head}</span>}
            <span className="toggle">›</span>
          </button>
          {expandedSection === 'head' && (
            <div className="items-grid">
              <button
                className="item-button clear"
                onClick={() => setCustomization({ ...customization, head: undefined })}
              >
                ✕ None
              </button>
              {ACCESSORIES.heads.map((item) => (
                <button
                  key={item.id}
                  className={`item-button ${customization.head === item.emoji ? 'selected' : ''}`}
                  onClick={() => setCustomization({ ...customization, head: item.emoji })}
                >
                  {item.emoji} {item.name.split(' ')[1]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top Accessories */}
        <div className="customization-group">
          <button
            className={`group-header ${expandedSection === 'top' ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'top' ? null : 'top')}
          >
            <span>👕 Tops</span>
            {customization.top && <span className="selected-item">{customization.top}</span>}
            <span className="toggle">›</span>
          </button>
          {expandedSection === 'top' && (
            <div className="items-grid">
              <button
                className="item-button clear"
                onClick={() => setCustomization({ ...customization, top: undefined })}
              >
                ✕ None
              </button>
              {ACCESSORIES.tops.map((item) => (
                <button
                  key={item.id}
                  className={`item-button ${customization.top === item.emoji ? 'selected' : ''}`}
                  onClick={() => setCustomization({ ...customization, top: item.emoji })}
                >
                  {item.emoji} {item.name.split(' ')[1]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Accessories */}
        <div className="customization-group">
          <button
            className={`group-header ${expandedSection === 'bottom' ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'bottom' ? null : 'bottom')}
          >
            <span>👖 Bottoms</span>
            {customization.bottom && <span className="selected-item">{customization.bottom}</span>}
            <span className="toggle">›</span>
          </button>
          {expandedSection === 'bottom' && (
            <div className="items-grid">
              <button
                className="item-button clear"
                onClick={() => setCustomization({ ...customization, bottom: undefined })}
              >
                ✕ None
              </button>
              {ACCESSORIES.bottoms.map((item) => (
                <button
                  key={item.id}
                  className={`item-button ${customization.bottom === item.emoji ? 'selected' : ''}`}
                  onClick={() => setCustomization({ ...customization, bottom: item.emoji })}
                >
                  {item.emoji} {item.name.split(' ')[1]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feet Accessories */}
        <div className="customization-group">
          <button
            className={`group-header ${expandedSection === 'feet' ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'feet' ? null : 'feet')}
          >
            <span>👟 Feet</span>
            {customization.feet && <span className="selected-item">{customization.feet}</span>}
            <span className="toggle">›</span>
          </button>
          {expandedSection === 'feet' && (
            <div className="items-grid">
              <button
                className="item-button clear"
                onClick={() => setCustomization({ ...customization, feet: undefined })}
              >
                ✕ None
              </button>
              {ACCESSORIES.feet.map((item) => (
                <button
                  key={item.id}
                  className={`item-button ${customization.feet === item.emoji ? 'selected' : ''}`}
                  onClick={() => setCustomization({ ...customization, feet: item.emoji })}
                >
                  {item.emoji} {item.name.split(' ')[1]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Accessories */}
        <div className="customization-group">
          <button
            className={`group-header ${expandedSection === 'acc' ? 'expanded' : ''}`}
            onClick={() => setExpandedSection(expandedSection === 'acc' ? null : 'acc')}
          >
            <span>✨ Accessories</span>
            {customization.accessory && <span className="selected-item">{customization.accessory}</span>}
            <span className="toggle">›</span>
          </button>
          {expandedSection === 'acc' && (
            <div className="items-grid">
              <button
                className="item-button clear"
                onClick={() => setCustomization({ ...customization, accessory: undefined })}
              >
                ✕ None
              </button>
              {ACCESSORIES.accessories.map((item) => (
                <button
                  key={item.id}
                  className={`item-button ${customization.accessory === item.emoji ? 'selected' : ''}`}
                  onClick={() => setCustomization({ ...customization, accessory: item.emoji })}
                >
                  {item.emoji} {item.name.split(' ')[1]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="achievements-section">
        <h2>Achievements</h2>
        <div className="achievements-grid">
          <div className="achievement-badge">
            <span className="badge-icon">🌙</span>
            <span className="badge-name">Night Owl</span>
          </div>
          <div className="achievement-badge">
            <span className="badge-icon">🎓</span>
            <span className="badge-name">Campus Crew</span>
          </div>
          <div className="achievement-badge">
            <span className="badge-icon">🌎</span>
            <span className="badge-name">Globe Trotter</span>
          </div>
          <div className="achievement-badge locked">
            <span className="badge-icon">🌱</span>
            <span className="badge-name">Touch Grass</span>
          </div>
        </div>
      </div>
    </div>
  );
}
