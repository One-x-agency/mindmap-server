import { Router } from 'express';
import authRoutes from '@/modules/auth/auth.route.js';
import fileRoutes from '@/modules/file/file.route.js';
import mindmapRoutes from '@/modules/mindmap/mindmap.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/files', fileRoutes);
router.use('/mindmaps', mindmapRoutes);

export default router;
