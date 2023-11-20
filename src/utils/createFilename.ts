function createFilename(filename: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${filename}_${date}.xlsx`;
}

export default createFilename;
