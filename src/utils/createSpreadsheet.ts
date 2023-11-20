import ExcelJS from 'exceljs';
import fs, { existsSync } from 'fs';
import path from 'path';
import createFilename from './createFilename';

async function createSpreadsheet(emails: (string | string[])[], filename?: string, baseDir?: string) {
  const dir = baseDir || 'output';
  const targetDir = filename?.replaceAll('/', path.sep) ?? createFilename('emailList');
  const targetFile = targetDir.endsWith('.xlsx') ? targetDir : targetDir + '.xlsx';
  const fullPathAsArray = path.join(dir, targetFile).split(path.sep);
  const file = fullPathAsArray.pop() as string;
  const outDir = fullPathAsArray.join(path.sep);
  const output = path.join(outDir, file);

  const workbook = new ExcelJS.Workbook();

  if (existsSync(output)) {
    await workbook.xlsx.readFile(output);
    let worksheet = workbook.getWorksheet(1) as ExcelJS.Worksheet;

    if (!worksheet) {
      worksheet = workbook.addWorksheet('Emails');
    }

    addEntries(worksheet, emails);
  } else {
    const worksheet = workbook.addWorksheet('Emails');
    addEntries(worksheet, emails);

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  }

  await workbook.xlsx.writeFile(output);
  console.log(`Spreadsheet created successfully at: ${output}`);
}

export default createSpreadsheet;

function addEntries(worksheet: ExcelJS.Worksheet, emails: (string | string[])[]) {
  const list = emails.map(entry => (typeof entry === 'string' ? [entry] : entry));
  list.forEach(entry => worksheet.addRow([...entry]));
}
