import { Router } from 'express';
import withDatabase from '@/shared/utilities/with-database.js';
import validate from '@/shared/middlewares/request-validator.js';
import { requireAuth } from '@/modules/auth/middlewares/require-auth.js';
import {
    Controller as getMindmaps,
    ValidationSchema as getMindmapsValidationSchema,
} from '@/modules/mindmap/controllers/get-mindmaps.js';
import {
    Controller as createMindmap,
    ValidationSchema as createMindmapValidationSchema,
} from '@/modules/mindmap/controllers/create-mindmap.js';
import {
    Controller as getMindmapById,
    ValidationSchema as getMindmapByIdValidationSchema,
} from '@/modules/mindmap/controllers/get-mindmap-by-id.js';
import {
    Controller as updateMindmap,
    ValidationSchema as updateMindmapValidationSchema,
} from '@/modules/mindmap/controllers/update-mindmap.js';
import {
    Controller as deleteMindmap,
    ValidationSchema as deleteMindmapValidationSchema,
} from '@/modules/mindmap/controllers/delete-mindmap.js';

const router = Router();

router.use(requireAuth);

router.route('/').get(validate(getMindmapsValidationSchema), withDatabase(getMindmaps));
router.route('/').post(validate(createMindmapValidationSchema), withDatabase(createMindmap));
router.route('/:mindmap_id').get(validate(getMindmapByIdValidationSchema), withDatabase(getMindmapById));
router.route('/:mindmap_id').patch(validate(updateMindmapValidationSchema), withDatabase(updateMindmap));
router.route('/:mindmap_id').delete(validate(deleteMindmapValidationSchema), withDatabase(deleteMindmap));

export default router;
