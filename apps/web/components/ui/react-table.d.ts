import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta {
    className?: string;
    editField?: string;
    type?: "select" | "text" | "number" | "date";
  }
}
