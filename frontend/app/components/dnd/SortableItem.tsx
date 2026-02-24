import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '@mui/icons-material';

interface SortableItemProps {
  id: string | number;
  children: React.ReactNode;
  className?: string;
  showHandle?: boolean;
}

export function SortableItem({
  id,
  children,
  className = '',
  showHandle = true,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showHandle && (
          <button
            {...attributes}
            {...listeners}
            className="drag-handle"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              border: 'none',
              background: 'transparent',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              color: '#9ca3af',
              touchAction: 'none',
            }}
            aria-label="Drag to reorder"
          >
            <DragIndicator sx={{ fontSize: 20 }} />
          </button>
        )}
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}