export interface BoardSnapshotEntry {
  stageId: number;
  stageName: string;
  stageColor: string;
  count: number;
}

export interface BoardSnapshot {
  id: number;
  generatedAt: string;
  generatedByName: string;
  entries: BoardSnapshotEntry[];
}
