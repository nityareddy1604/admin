import { config } from 'dotenv';
import { LensSelection } from '../db/pool.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/idea/getIdeaLensStatus.js';

export async function adminGetIdeaLensStatus(body) {
    const { ideaId, requestId } = body;
    delete body.requestId;
    
    try {
        // Validate required fields
        if (!ideaId) {
            return {
                statusCode: 400,
                body: {
                    message: 'ideaId is required'
                }
            };
        }

        // Get all lens selections for this idea
        const lensSelections = await LensSelection.findAll({
            where: {
                idea_id: ideaId
            },
            attributes: ['lens_type', 'status', 'created_at', 'updated_at'],
            order: [['created_at', 'ASC']]
        });

        if (lensSelections.length === 0) {
            return {
                statusCode: 404,
                body: {
                    message: 'No lens selections found for this idea'
                }
            };
        }

        // Format lens statuses
        const lensStatuses = lensSelections.map(lens => ({
            lensType: lens.lens_type,
            status: lens.status,
            createdAt: lens.created_at,
            updatedAt: lens.updated_at
        }));

        // Calculate completion statistics
        const totalLenses = lensSelections.length;
        const completedLenses = lensSelections.filter(lens => lens.status === 'completed').length;
        const inProgressLenses = lensSelections.filter(lens => lens.status === 'in_progress').length;
        const pendingLenses = lensSelections.filter(lens => lens.status === 'pending').length;
        const completionPercentage = totalLenses > 0 ? Math.round((completedLenses / totalLenses) * 100) : 0;

        const statistics = {
            totalLenses: totalLenses,
            completedLenses: completedLenses,
            inProgressLenses: inProgressLenses,
            pendingLenses: pendingLenses,
            completionPercentage: completionPercentage,
            allLensesCompleted: completedLenses === totalLenses && totalLenses > 0
        };

        logger.info(FILE_NAME, 'adminGetIdeaLensStatus', requestId, {
            ideaId,
            totalLenses,
            completedLenses,
            completionPercentage,
            message: 'Idea lens status retrieved successfully'
        });

        return {
            statusCode: 200,
            body: {
                message: 'Idea lens status retrieved successfully',
                ideaId: ideaId,
                lensStatuses: lensStatuses,
                statistics: statistics
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'adminGetIdeaLensStatus', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            ideaId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to retrieve idea lens status'
            }
        };
    }
}