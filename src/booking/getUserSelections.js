import { config } from 'dotenv';
import { UserSelection, User, UserInformation, Idea } from '../db/pool.js';
import { logger } from '../logger/logger.js';

config();
const FILE_NAME = 'admin/booking/getUserSelections.js';

export async function adminGetUserSelections(body) {
    const { requestId } = body;
    delete body.requestId;
    
    try {
        // Get all user selections with proper relationships
        const userSelections = await UserSelection.findAll({
            include: [
                {
                    model: User,
                    as: 'user', // This is the SELECTED user (SME/founder)
                    attributes: ['id', 'email', 'persona_type'],
                    include: [
                        {
                            model: UserInformation,
                            as: 'user_information',
                            attributes: ['name', 'profile_title', 'country', 'industry', 'description'],
                            required: false
                        }
                    ]
                },
                {
                    model: Idea,
                    as: 'idea',
                    attributes: ['id', 'name', 'description', 'targeted_audience', 'stage', 'user_id'],
                    include: [
                        {
                            model: User,
                            // This is the idea OWNER (founder who made selections)
                            attributes: ['id', 'email', 'persona_type'],
                            include: [
                                {
                                    model: UserInformation,
                                    as: 'user_information',
                                    attributes: ['name', 'profile_title'],
                                    required: false
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Group by founder (idea owner) and their selections
        const groupedByFounder = {};
        
        userSelections.forEach(selection => {
            const founder = selection.idea.User; // The idea owner (founder)
            const founderId = founder.id;
            
            if (!groupedByFounder[founderId]) {
                groupedByFounder[founderId] = {
                    founder: {
                        id: founder.id,
                        email: founder.email,
                        persona_type: founder.persona_type,
                        name: founder.user_information?.name || null,
                        profile_title: founder.user_information?.profile_title || null
                    },
                    idea: {
                        id: selection.idea.id,
                        name: selection.idea.name,
                        description: selection.idea.description,
                        targeted_audience: selection.idea.targeted_audience,
                        stage: selection.idea.stage
                    },
                    selected_users: []
                };
            }
            
            // Add the selected user (SME/founder that was chosen)
            groupedByFounder[founderId].selected_users.push({
                id: selection.user.id,
                email: selection.user.email,
                persona_type: selection.user.persona_type,
                user_type: selection.user_type, // SME/founder type in selection
                name: selection.user.user_information?.name || null,
                profile_title: selection.user.user_information?.profile_title || null,
                country: selection.user.user_information?.country || null,
                industry: selection.user.user_information?.industry || null,
                description: selection.user.user_information?.description || null,
                selected_at: selection.created_at
            });
        });

        // Convert to array format for easier frontend consumption
        const formattedData = Object.values(groupedByFounder);

        logger.info(FILE_NAME, 'adminGetUserSelections', requestId, {
            totalFounders: formattedData.length,
            totalSelections: userSelections.length,
            message: 'User selections retrieved successfully'
        });

        return {
            statusCode: 200,
            body: {
                message: 'User selections retrieved successfully',
                data: formattedData,
                summary: {
                    totalFounders: formattedData.length,
                    totalSelections: userSelections.length,
                    avgSelectionsPerFounder: formattedData.length > 0 ? 
                        (userSelections.length / formattedData.length).toFixed(1) : 0
                }
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'adminGetUserSelections', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to retrieve user selections'
            }
        };
    }
}