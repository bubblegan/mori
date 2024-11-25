export function formatCategoryIdByName(categories: { id: number; title: string }[]) {
  let categoryIdByName: Record<string, number> = {};

  if (categories && categories?.length > 0) {
    categoryIdByName = categories?.reduce((byId: Record<string, number>, curr) => {
      byId[curr.title] = curr.id;
      return byId;
    }, {});
  }

  return categoryIdByName;
}
