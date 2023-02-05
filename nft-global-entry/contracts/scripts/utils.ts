export function slices(arr: unknown[], size: number): unknown[][] {
  const res: unknown[][] = [];
  while (arr.length) {
    res.push(arr.splice(0, size));
  }

  return res;
}
