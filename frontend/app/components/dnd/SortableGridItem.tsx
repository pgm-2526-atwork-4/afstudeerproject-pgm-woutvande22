import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragIndicator } from '@mui/icons-material';

interface SortableGridItemProps {
  id: string | number;
  children: React.ReactNode;
  className?: string;
}

export function SortableGridItem({
  id,
  children,
  className = '',
}: SortableGridItemProps) {
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
      <button
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          cursor: isDragging ? 'grabbing' : 'grab',
          border: 'none',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '4px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          color: '#ffffff',
          zIndex: 10,
          touchAction: 'none',
        }}
        aria-label="Drag to reorder"
      >
        <DragIndicator sx={{ fontSize: 16 }} />
      </button>
      {children}
    </div>
  );
}