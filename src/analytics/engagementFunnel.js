// backend/src/ADMIN/analytics/engagementFunnel.js
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { User, UserInformation, Idea, Form, FormResponses } from '../db/pool.js';

config();
const FILE_NAME = 'analytics/engagementFunnel.js';

export async function engagementFunnel(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // Use separate Sequelize queries to avoid complex joins
        
        // 1. Total users
        const totalUsers = await User.count({
            where: { deleted_at: null }
        });

        // 2. Users with profiles
        const usersWithProfiles = await UserInformation.count({
            distinct: true,
            col: 'user_id'
        });

        // 3. Users with ideas  
        const usersWithIdeas = await Idea.count({
            distinct: true,
            col: 'user_id'
        });

        // 4. Users with forms (as creators)
        const usersWithForms = await Form.count({
            distinct: true,
            col: 'creator_id'
        });

        // 5. Users with responses (as responders)
        const usersWithResponses = await FormResponses.count({
            distinct: true,
            col: 'responder_id'
        });

        return {
            statusCode: 200,
            body: {
                userJourney: {
                    total_users: totalUsers || 0,
                    users_with_profiles: usersWithProfiles || 0,
                    users_with_ideas: usersWithIdeas || 0,
                    users_with_forms: usersWithForms || 0,
                    users_with_responses: usersWithResponses || 0
                },
                message: 'Engagement funnel retrieved successfully'
            }
        };
    } catch (error) {
        logger.error(FILE_NAME, 'engagementFunnel', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to get engagement funnel.',
            }
        };
    }
}