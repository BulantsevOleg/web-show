export function slugify(s: string): string {
    return (s || "")
      .toString()
      .trim()
      .toLowerCase()
      // латиница + кириллица + цифры + пробелы и дефисы
      .replace(/[^a-z0-9\u0400-\u04FF\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  