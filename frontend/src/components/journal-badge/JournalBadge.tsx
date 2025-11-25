import React from 'react';
import styles from './JournalBadge.module.css';

export interface JournalBadgeProps {
  status: 'none' | 'trade' | 'settled';
  onClick: () => void;
}

const JournalBadge: React.FC<JournalBadgeProps> = ({ status, onClick }) => {
  const badgeClass = `${styles['journal-badge']} ${styles[`journal-badge-${status}`]}`;
  
  const getLabel = () => {
    switch (status) {
      case 'none':
        return '0';
      case 'trade':
        return '1';
      case 'settled':
        return '2';
      default:
        return '?';
    }
  };
  
  return (
    <span className={badgeClass} onClick={onClick} title="View journals">
      {getLabel()}
    </span>
  );
};

export default JournalBadge;