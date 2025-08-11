// backend/src/ADMIN/analytics/formsOverview.js
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { Form, FormResponses } from '../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'analytics/formsOverview.js';

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

export async function formsOverview(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        const { period = 'all' } = body;
        const dateFilter = getDateFilter(period);
        
        const whereClause = {};
        if (dateFilter) {
            whereClause.created_at = dateFilter;
        }

        // Query 1: Form stats (working fine)
        const formStats = await Form.findOne({
            where: whereClause,
            attributes: [
                [Form.sequelize.fn('COUNT', Form.sequelize.col('id')), 'total_forms'],
                [Form.sequelize.fn('COUNT', Form.sequelize.literal("CASE WHEN form_url IS NOT NULL THEN 1 END")), 'forms_with_url']
            ],
            raw: true
        });

        // Query 2: Total responses (working fine)
        const responseStats = await FormResponses.findOne({
            where: whereClause,
            attributes: [
                [FormResponses.sequelize.fn('COUNT', FormResponses.sequelize.col('id')), 'total_responses']
            ],
            raw: true
        });

        // Query 3: Completion rate using raw SQL to avoid Sequelize complexity
        const completionQuery = `
            SELECT 
                COUNT(DISTINCT f.id) as total_forms,
                COUNT(DISTINCT fr.form_id) as forms_with_responses,
                CASE 
                    WHEN COUNT(DISTINCT f.id) = 0 THEN 0
                    ELSE ROUND((COUNT(DISTINCT fr.form_id)::numeric / COUNT(DISTINCT f.id)::numeric * 100), 2)
                END as completion_rate
            FROM forms f 
            LEFT JOIN form_responses fr ON f.id = fr.form_id
            ${dateFilter ? 'WHERE f.created_at >= $1' : ''}
        `;

        const completionStats = await Form.sequelize.query(
            completionQuery,
            {
                bind: dateFilter ? [dateFilter[Op.gte]] : [],
                type: Form.sequelize.QueryTypes.SELECT
            }
        );

        return {
            statusCode: 200,
            body: {
                forms: {
                    total_forms: parseInt(formStats.total_forms || 0),
                    forms_with_url: parseInt(formStats.forms_with_url || 0)
                },
                totalResponses: {
                    total_responses: parseInt(responseStats.total_responses || 0)
                },
                completion: {
                    total_forms: parseInt(completionStats[0].total_forms || 0),
                    forms_with_responses: parseInt(completionStats[0].forms_with_responses || 0),
                    completion_rate: parseFloat(completionStats[0].completion_rate || 0)
                },
                message: 'Forms overview retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'formsOverview', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get forms overview.',
            }
        };
    }
}