import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { UPLOADS_DIR } from '../config/env.js';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
};

// Magic-Bytes je Format (Anfang der Datei)
const MAGIC = [
  { ext: '.jpg', bytes: [0xff, 0xd8, 0xff] },
  { ext: '.png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: '.gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  // WEBP/AVIF haben Container-Header (RIFF/ftyp) – per MIME geprüft, Inhalt unten validiert
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || '.bin';
    const name = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED[file.mimetype]) {
    return cb(new Error('Nur Bilddateien (JPG, PNG, WEBP, AVIF, GIF) sind erlaubt.'));
  }
  cb(null, true);
}

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES, files: 8 },
});

// Nachträgliche Magic-Byte-Prüfung: löscht hochgeladene Dateien, die nicht wie Bilder beginnen.
export function verifyUploadedImages(req, res, next) {
  const files = req.files || [];
  for (const f of files) {
    try {
      const fd = fs.openSync(f.path, 'r');
      const buf = Buffer.alloc(12);
      fs.readSync(fd, buf, 0, 12, 0);
      fs.closeSync(fd);

      const okMagic = MAGIC.some((m) => m.bytes.every((b, i) => buf[i] === b));
      const isRiffWebp = buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
      const isAvif = buf.toString('ascii', 4, 8) === 'ftyp';

      if (!okMagic && !isRiffWebp && !isAvif) {
        fs.unlinkSync(f.path);
        return res.status(400).json({ error: `Datei ${f.originalname} ist kein gültiges Bild.` });
      }
      // Versuche, eine verkleinerte Thumbnail-Version zu erstellen (soweit möglich)
      try {
        const thumbName = path.basename(f.path) + '.thumb.jpg';
        const thumbPath = path.join(UPLOADS_DIR, thumbName);
        // 600px lange Kante, JPEG
        sharp(f.path).resize({ width: 900, height: 900, fit: 'inside' }).jpeg({ quality: 82 }).toFile(thumbPath);
        // Kennzeichne das erzeugte Thumbnail für späteren Gebrauch
        f.thumbFilename = thumbName;
      } catch (e) {
        // wenn Sharp fehlschlägt, lassen wir das Bild trotzdem zu; kein Blocking
      }
    } catch {
      return res.status(400).json({ error: 'Upload-Prüfung fehlgeschlagen.' });
    }
  }
  next();
}

// Multer-Fehler hübsch behandeln
export function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError || /Bilddateien/.test(err?.message || '')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

export function publicUploadPath(filename) {
  return '/uploads/' + path.basename(filename);
}
