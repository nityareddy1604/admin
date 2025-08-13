// src/idea/getAllIdeas.js
import { config } from 'dotenv';
import { logger } from '../logger/logger.js';
import { Idea, User, UserInformation } from '../db/pool.js';
import { Op } from 'sequelize';

config();
const FILE_NAME = 'idea/getAllIdeas.js';

export async function adminGetAllIdeas(body) {
    const requestId = body.requestId;
    delete body.requestId;
    
    try {
        // Extract query parameters for filtering
        const { 
            status,      // Filter by idea status
            stage,       // Filter by idea stage  
            period,      // Filter by time period
            limit = 50,  // Pagination limit
            offset = 0   // Pagination offset
        } = body;
        
        // Build where clause
        const whereClause = {};
        
        if (status) {
            whereClause.status = status;
        }
        
        if (stage) {
            whereClause.stage = stage;
        }
        
        if (period && period !== 'all') {
            const dateFilter = getDateFilter(period);
            if (dateFilter) {
                whereClause.created_at = dateFilter;
            }
        }
        
        // Fetch ideas with creator information
        const ideasFromDB = await Idea.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
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
            attributes: [
                'id', 'user_id', 'name', 'description', 'targeted_audience',
                'stage', 'status', 'idea_capture', 'lens_selector', 
                'survey_generator', 'ai_request_id', 'created_at', 'updated_at',
                'pitch_deck', 'voice_note', 'document'
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            raw: false
        });
        
        // Get total count for pagination
        const totalCount = await Idea.count({ where: whereClause });
        
        // Format response data
        const formattedIdeas = ideasFromDB.map(idea => {
            const ideaData = idea.toJSON();
            const creator = ideaData.User;
            const creatorInfo = creator?.user_information;
            
            return {
                id: ideaData.id,
                user_id: ideaData.user_id,
                name: ideaData.name,
                description: ideaData.description,
                targeted_audience: ideaData.targeted_audience,
                stage: ideaData.stage,
                status: ideaData.status,
                ai_request_id: ideaData.ai_request_id,
                created_at: ideaData.created_at,
                updated_at: ideaData.updated_at,
                
                // S3 URLs (without fetching content for performance)
                idea_capture: ideaData.idea_capture,
                lens_selector: ideaData.lens_selector,
                survey_generator: ideaData.survey_generator,
                
                // File attachments
                pitch_deck: ideaData.pitch_deck,
                voice_note: ideaData.voice_note,
                document: ideaData.document,
                
                // Creator information
                creator_name: creatorInfo?.name || null,
                creator_email: creator?.email || null,
                creator_persona_type: creator?.persona_type || null
            };
        });
        
        logger.info(FILE_NAME, 'adminGetAllIdeas', requestId, {
            message: 'Admin successfully retrieved all ideas',
            totalIdeas: totalCount,
            returnedIdeas: formattedIdeas.length,
            appliedFilters: { status, stage, period }
        });
        
        return {
            statusCode: 200,
            body: {
                message: 'All ideas fetched successfully',
                data: formattedIdeas,
                count: totalCount,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + formattedIdeas.length) < totalCount
                },
                filters: {
                    status: status || 'all',
                    stage: stage || 'all',
                    period: period || 'all'
                }
            }
        };
        
    } catch (error) {
        logger.error(FILE_NAME, 'adminGetAllIdeas', requestId, {
            error,
            errorMessage: error.message,
            errorStack: error.stack
        });
        return {
            statusCode: 500,
            body: {
                message: 'Internal Server Error! Failed to fetch ideas.'
            }
        };
    }
}

// Helper function for date filtering
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
        case 'quarter':
            return { [Op.gte]: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        default:
            return null;
    }
}