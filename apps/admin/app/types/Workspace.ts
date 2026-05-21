export type WorkspaceAdminSnapshot = {
  adminId: string;
  name: string;
  email: string;
  role: string;
};

export type WorkspaceNote = {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdBy: WorkspaceAdminSnapshot | null;
  updatedBy: WorkspaceAdminSnapshot | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WorkspaceFile = {
  id: string;
  name: string;
  mimeType: string;
  kind: "image" | "file";
  size: number;
  dataUrl: string;
  uploadedBy: WorkspaceAdminSnapshot | null;
  updatedBy: WorkspaceAdminSnapshot | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WorkspaceSheetColumn = {
  id: string;
  label: string;
};

export type WorkspaceSheetRow = {
  id: string;
  cells: Record<string, string>;
};

export type WorkspaceSheet = {
  id: string;
  name: string;
  description: string;
  columns: WorkspaceSheetColumn[];
  rows: WorkspaceSheetRow[];
  createdBy: WorkspaceAdminSnapshot | null;
  updatedBy: WorkspaceAdminSnapshot | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
