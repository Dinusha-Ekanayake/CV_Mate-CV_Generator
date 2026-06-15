import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableItem = ({ id, children, isHidden }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 99 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`dynamic-item sortable-item ${isHidden ? 'item-hidden' : ''}`}
    >
      <div 
        className="drag-handle" 
        {...attributes} 
        {...listeners}
        title="Drag to reorder"
      >
        ⠿
      </div>
      {children}
    </div>
  );
};
