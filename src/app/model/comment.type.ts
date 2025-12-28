export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  SAD = 'SAD',
  ANGRY = 'ANGRY'
}

export interface CommentType {
  id: number;
  author: {
    id: number | string;
    name: string;
  };
  message: string;
  imageUrl?: string;
  createdAt: string;
  parentId?: number;
  reactionCount: number;
  reactionSummary: { [key in ReactionType]?: number };
  replies: CommentType[];
}
