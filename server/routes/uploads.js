import express from 'express';
import { v2 as cloudinary } from 'cloudinary';

// If CLOUDINARY_URL is set, Cloudinary auto-configures. No manual config needed.

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const file = req.body.file; // base64 data URL or remote image URL
    if (!file) {
      return res.status(400).json({ error: 'Missing "file" in request body' });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: 'astrona/uploads',
      resource_type: 'image'
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
