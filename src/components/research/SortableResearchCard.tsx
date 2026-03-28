import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import ResearchPostCard from "./ResearchPostCard";

interface SortableResearchCardProps {
  article: any;
  commentCount: number;
  reactionCount: number;
  viewMode: "grid" | "feed";
  onClick: () => void;
  onEdit?: () => void;
  isSorting: boolean;
}

const SortableResearchCard = ({ article, isSorting, ...rest }: SortableResearchCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  if (!isSorting) {
    return <ResearchPostCard article={article} {...rest} />;
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground rounded-md p-1.5 cursor-grab active:cursor-grabbing shadow-lg"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <ResearchPostCard article={article} {...rest} />
    </div>
  );
};

export default SortableResearchCard;
