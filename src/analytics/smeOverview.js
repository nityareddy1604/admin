// backend/src/ADMIN/analytics/smeOverview.js
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { User, UserInformation, FormResponses } from '../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/smeOverview.js';

function getDateFilter(period) {
    const now = new Date();
    switch (period) {
        case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return { [Op.gte]: today };
        case 'week':
            return { [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        case 'month':
            return { [Op.gte]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        default:
            return null;
    }
}

export async function smeOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        const dateFilter = getDateFilter(period);
        
        const whereClause = {};
        if (dateFilter) {
            whereClause.created_at = dateFilter;
        }

        // Query 1: Total SMEs
        const totalSmes = await User.count({
            where: {
                ...whereClause,
                persona_type: 'sme',
                deleted_at: null
            }
        });

        // Query 2: Verified SMEs
        const verifiedSmes = await User.count({
            where: {
                ...whereClause,
                persona_type: 'sme',
                email_verified_at: { [Op.ne]: null },
                deleted_at: null
            }
        });

        // Query 3: SMEs who have responded to forms
        const respondingSmes = await FormResponses.count({
            distinct: true,
            col: 'responder_id',
            include: [{
                model: User,
                where: {
                    persona_type: 'sme',
                    deleted_at: null
                },
                required: true,
                attributes: []
            }]
        });

        // Query 4: SME by industry
        const smeByIndustry = await UserInformation.findAll({
            attributes: [
                'industry',
                [UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'sme_count']
            ],
            include: [{
                model: User,
                as: 'user',
                where: {
                    persona_type: 'sme',
                    deleted_at: null
                },
                attributes: [],
                required: true
            }],
            where: {
                industry: { [Op.not]: null }
            },
            group: ['industry'],
            order: [[UserInformation.sequelize.fn('COUNT', UserInformation.sequelize.col('UserInformation.id')), 'DESC']],
            limit: 10,
            raw: true
        });

        return {
            statusCode: 200,
            body: {
                overview: {
                    total_smes: totalSmes || 0,
                    verified_smes: verifiedSmes || 0,
                    responding_smes: respondingSmes || 0
                },
                byIndustry: smeByIndustry.map(item => ({
                    industry: item.industry,
                    sme_count: parseInt(item.sme_count)
                })),
                message: 'SME overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'smeOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get SME overview.',
            }
        };
    }
}