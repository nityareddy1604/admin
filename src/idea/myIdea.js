import { config } from 'dotenv';
import { Idea, LensSelection, UserSelection, User, UserInformation, Form } from '../db/pool.js';
import { logger } from '../logger/logger.js';
import axios from 'axios';

config();

const FILE_NAME = 'myIdea.js';

export async function myIdea(body) {
    const { userId, requestId, targetUserId } = body;

    try {
        // For admin users, they can specify a targetUserId to view someone else's idea
        // For regular users, they can only view their own ideas
        let queryUserId;
        
        if (userId === 'admin') {
            if (!targetUserId) {
                return {
                    statusCode: 400,
                    body: {
                        message: 'Admin must specify targetUserId to view user ideas.'
                    }
                };
            }
            queryUserId = targetUserId;
        } else {
            queryUserId = userId;
        }

        // Validate that queryUserId is a number
        if (isNaN(Number(queryUserId))) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid user ID format.'
                }
            };
        }

        // Get the latest idea for the specified user
        const latestIdea = await Idea.findOne({
            where: {
                user_id: Number(queryUserId)
            },
            order: [['created_at', 'DESC']]
        });

        if (!latestIdea) {
            return {
                statusCode: 404,
                body: {
                    message: 'No idea found for this user.'
                }
            };
        }

        // Get lens selections for this idea
        const lensSelections = await LensSelection.findAll({
            where: {
                idea_id: latestIdea.id
            },
            attributes: ['lens_type', 'status']
        });

        // Get the latest form for this idea
        const latestForm = await Form.findOne({
            where: {
                idea_id: latestIdea.id
            },
            attributes: ['id', 'form_url', 'start_time', 'end_time', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        // Get user selections for this idea with user information
        const userSelections = await UserSelection.findAll({
            where: {
                idea_id: latestIdea.id
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'persona_type'],
                    include: [
                        {
                            model: UserInformation,
                            as: 'user_information',
                            attributes: ['name', 'avatar', 'profile_title']
                        }
                    ]
                }
            ],
        });

        console.log('userSelections', userSelections)

        // Fetch form data from S3 if form exists
        let formWithData = null;
        if (latestForm) {
            try {
                const response = await axios.get(latestForm.form_url);
                formWithData = {
                    id: latestForm.id,
                    form_url: latestForm.form_url,
                    start_time: latestForm.start_time,
                    end_time: latestForm.end_time,
                    created_at: latestForm.created_at,
                    form_data: response.data
                };
            } catch (error) {
                logger.warn(FILE_NAME, 'fetchFormData', requestId, {
                    formId: latestForm.id,
                    formUrl: latestForm.form_url,
                    error: error.message
                });
                formWithData = {
                    id: latestForm.id,
                    form_url: latestForm.form_url,
                    start_time: latestForm.start_time,
                    end_time: latestForm.end_time,
                    created_at: latestForm.created_at,
                    form_data: null
                };
            }
        }

        // Format the response
        const ideaData = {
            ...latestIdea.toJSON(),
            lens_selections: lensSelections,
            user_selections: userSelections.map(selection => ({
                user_id: selection.user?.id,
                user_type: selection.user_type,
                user_name: selection.user?.user_information?.name || 'Unknown',
                avatar: selection.user?.user_information?.avatar || null,
                profile_title: selection.user?.user_information?.profile_title || null
            })),
            form: formWithData
        };

        logger.info(FILE_NAME, 'myIdea', requestId, {
            userId: queryUserId,
            ideaId: latestIdea.id,
            requestedBy: userId,
            message: 'Latest idea fetched successfully'
        });

        return {
            statusCode: 200,
            body: {
                message: 'Latest idea fetched successfully.',
                data: ideaData
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'myIdea', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error while fetching latest idea.'
            }
        };
    }
}