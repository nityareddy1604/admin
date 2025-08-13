import { config } from 'dotenv';
import { FormResponses, User, UserInformation } from '../db/pool.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/forms/getFormResponses.js';

export async function adminGetFormResponses(body) {
    const { formId, requestId } = body;
    delete body.requestId;
    
    try {
        // Validate required fields
        if (!formId) {
            return {
                statusCode: 400,
                body: {
                    message: 'formId is required'
                }
            };
        }

        // Get all responses for the form
        const responses = await FormResponses.findAll({
            where: { form_id: formId },
            include: [
                {
                    model: User,
                    // No alias needed - use the default association
                    attributes: ['id', 'email', 'persona_type'],
                    include: [
                        {
                            model: UserInformation,
                            as: 'user_information',
                            attributes: ['name'],
                            required: false
                        }
                    ],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Format responses
        const formattedResponses = responses.map(response => ({
            id: response.id,
            form_id: response.form_id,
            responder_id: response.responder_id,
            form_response_url: response.form_response_url,
            created_at: response.created_at,
            updated_at: response.updated_at,
            
            // Responder information (if available)
            responder: response.User ? {
                id: response.User.id,
                email: response.User.email,
                persona_type: response.User.persona_type,
                name: response.User.user_information?.name || null
            } : null
        }));

        // Calculate response statistics
        const totalResponses = responses.length;
        const uniqueResponders = new Set(responses.map(r => r.responder_id)).size;
        const responsesByDay = {};

        // Group responses by day
        responses.forEach(response => {
            const day = response.created_at.toISOString().split('T')[0];
            responsesByDay[day] = (responsesByDay[day] || 0) + 1;
        });

        const responseTimeline = Object.entries(responsesByDay).map(([date, count]) => ({
            date,
            responses_count: count
        })).sort((a, b) => a.date.localeCompare(b.date));

        logger.info(FILE_NAME, 'adminGetFormResponses', requestId, {
            formId,
            totalResponses,
            uniqueResponders,
            message: 'Form responses retrieved successfully'
        });

        return {
            statusCode: 200,
            body: {
                message: 'Form responses retrieved successfully',
                formId: formId,
                responses: formattedResponses,
                statistics: {
                    totalResponses,
                    uniqueResponders,
                    responseTimeline
                }
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'adminGetFormResponses', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack,
            formId
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to retrieve form responses'
            }
        };
    }
}
