import { config } from 'dotenv';
import { Form, Idea, User, UserInformation, FormResponses } from '../db/pool.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/forms/getAllForms.js';

export async function adminGetAllForms(body) {
    const { requestId } = body;
    delete body.requestId;
    
    try {
        // Get all forms with idea and user information
        const forms = await Form.findAll({
            include: [
                {
                    model: Idea,
                    as: 'idea',
                    attributes: ['id', 'name', 'description', 'targeted_audience', 'stage', 'status'],
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
                            ]
                        }
                    ]
                },
                {
                    model: User,
                    as: 'user', // This is the Form creator association
                    attributes: ['id', 'email', 'persona_type'],
                    include: [
                        {
                            model: UserInformation,
                            as: 'user_information',
                            attributes: ['name'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Get response counts for each form
        const formsWithCounts = await Promise.all(forms.map(async (form) => {
            const responseCount = await FormResponses.count({
                where: { form_id: form.id }
            });

            return {
                // Form fields
                id: form.id,
                creator_id: form.creator_id,
                idea_id: form.idea_id,
                form_url: form.form_url,
                start_time: form.start_time,
                end_time: form.end_time,
                created_at: form.created_at,
                updated_at: form.updated_at,
                
                // Idea information
                idea: {
                    id: form.idea.id,
                    name: form.idea.name,
                    description: form.idea.description,
                    targeted_audience: form.idea.targeted_audience,
                    stage: form.idea.stage,
                    status: form.idea.status
                },
                
                // User/Creator information  
                creator: {
                    id: form.user.id, // Form creator (direct association)
                    email: form.user.email,
                    persona_type: form.user.persona_type,
                    name: form.user.user_information?.name || null
                },
                
                // Idea owner information
                idea_owner: {
                    id: form.idea.User.id, // Idea owner
                    email: form.idea.User.email,
                    persona_type: form.idea.User.persona_type,
                    name: form.idea.User.user_information?.name || null
                },
                
                // Statistics
                total_responses: responseCount,
                
                // Status calculation
                is_active: form.start_time && (!form.end_time || new Date(form.end_time) > new Date()),
                is_expired: form.end_time && new Date(form.end_time) < new Date()
            };
        }));

        // Calculate summary statistics
        const totalForms = formsWithCounts.length;
        const activeForms = formsWithCounts.filter(f => f.is_active).length;
        const totalResponses = formsWithCounts.reduce((sum, f) => sum + f.total_responses, 0);
        const avgResponsesPerForm = totalForms > 0 ? Math.round(totalResponses / totalForms) : 0;

        logger.info(FILE_NAME, 'adminGetAllForms', requestId, {
            totalForms,
            activeForms,
            totalResponses,
            message: 'All forms retrieved successfully'
        });

        return {
            statusCode: 200,
            body: {
                message: 'Forms retrieved successfully',
                forms: formsWithCounts,
                summary: {
                    totalForms,
                    activeForms,
                    totalResponses,
                    avgResponsesPerForm
                }
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'adminGetAllForms', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to retrieve forms'
            }
        };
    }
}