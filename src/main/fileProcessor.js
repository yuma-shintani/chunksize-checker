import fs from 'fs-extra'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import xlsx from 'xlsx'
import csvParser from 'csv-parser'
import yauzl from 'yauzl'
import { encoding_for_model } from 'tiktoken'

/**
 * Counting text toaken
 */
async function countTokens(text) {
  const enc = encoding_for_model('gpt-4o')
  const tokens = enc.encode(text)
  return tokens.length
}

/**
 * Calculate optimal chunk size
 */
async function getOptimalChunkSize(text) {
  const totalTokens = await countTokens(text)
  let chunkSize = Math.min(Math.max(Math.floor(totalTokens * 0.05), 256), 2048)
  let chunkOverlap = Math.floor(chunkSize * 0.3)

  return { totalTokens, chunkSize, chunkOverlap }
}

/**
 * Extract text from PowerPoint (.pptx) files
 */
async function extractTextFromPptx(filePath) {
  return new Promise((resolve, reject) => {
    let text = ''

    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err)

      zipfile.readEntry()
      zipfile.on('entry', (entry) => {
        if (entry.fileName.startsWith('ppt/slides/slide') && entry.fileName.endsWith('.xml')) {
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err)

            let slideText = ''
            readStream.on('data', (chunk) => {
              slideText += chunk.toString()
            })

            readStream.on('end', () => {
              slideText = slideText.replace(/<[^>]+>/g, ' ')
              text += slideText + '\n'
              zipfile.readEntry()
            })
          })
        } else {
          zipfile.readEntry()
        }
      })

      zipfile.on('end', () => resolve(text))
    })
  })
}

/**
 * Extract text based on file type
 */
export async function processFile(filePath) {
  const ext = filePath.split('.').pop().toLowerCase()

  let text = ''

  if (['txt', 'md', 'log'].includes(ext)) {
    text = await fs.readFile(filePath, 'utf-8')
  } else if (ext === 'json') {
    text = JSON.stringify(await fs.readJson(filePath), null, 2)
  } else if (ext === 'pdf') {
    const data = await pdf(await fs.readFile(filePath))
    text = data.text
  } else if (ext === 'docx') {
    text = (await mammoth.extractRawText({ buffer: await fs.readFile(filePath) })).value
  } else if (ext === 'csv') {
    text = await new Promise((resolve, reject) => {
      let output = ''
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => (output += Object.values(row).join(', ') + '\n'))
        .on('end', () => resolve(output))
        .on('error', reject)
    })
  } else if (ext === 'xlsx') {
    const workbook = xlsx.readFile(filePath)
    workbook.SheetNames.forEach((sheetName) => {
      text += xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]) + '\n'
    })
  } else if (ext === 'pptx') {
    text = await extractTextFromPptx(filePath)
  } else {
    throw new Error('対応していないファイル形式です。')
  }

  return getOptimalChunkSize(text)
}
